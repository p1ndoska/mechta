const express = require('express');
const prisma = require('./prisma');

const FIELDS = {
  id: true,
  title: true,
  description: true,
  price: true,
  priceFrom: true,
  sortOrder: true,
  photoType: true,
  updatedAt: true,
};
const PHOTO_ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];
const WITH_PHOTOS = { ...FIELDS, photos: { select: { id: true }, orderBy: PHOTO_ORDER } };
const ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];
const PHOTO_TYPES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
};

function toJson(room) {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    price: Number(room.price),
    priceFrom: room.priceFrom,
    // Версия в адресе меняется при каждом изменении карточки, поэтому фото можно кэшировать надолго
    photoUrl: room.photoType ? `/api/rooms/${room.id}/photo?v=${room.updatedAt.getTime()}` : null,
    ...(room.photos && {
      photos: room.photos.map((photo) => ({ id: photo.id, url: `/api/rooms/${room.id}/photos/${photo.id}` })),
    }),
  };
}

// Пришедшее фото или null, если это не JPEG/PNG/WebP
function readPhoto(req) {
  const type = req.get('content-type');
  const check = PHOTO_TYPES[type];
  return check && Buffer.isBuffer(req.body) && check(req.body) ? { data: req.body, type } : null;
}

const rawPhoto = express.raw({ type: Object.keys(PHOTO_TYPES), limit: '10mb' });
const PHOTO_ERROR = { error: 'Фото должно быть в формате JPEG, PNG или WebP' };

// Новый порядок: элемент с индексом index сдвигается вверх или вниз
function swapped(items, index, direction) {
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || target < 0 || target >= items.length) return null;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

async function listRooms(select = FIELDS) {
  const rooms = await prisma.room.findMany({ select, orderBy: ORDER });
  return rooms.map(toJson);
}

function parseRoom(body) {
  const { title, description = '', price, priceFrom = false } = body ?? {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
    return { error: 'Название: от 1 до 100 символов' };
  }
  if (typeof description !== 'string' || description.length > 3000) {
    return { error: 'Описание: не длиннее 3000 символов' };
  }
  const value = Number(price);
  if (price === '' || price === null || !Number.isFinite(value) || value <= 0 || value > 100000) {
    return { error: 'Цена: число больше 0' };
  }
  if (typeof priceFrom !== 'boolean') return { error: 'Неверное значение «от»' };
  return {
    data: { title: title.trim(), description: description.trim(), price: Math.round(value * 100) / 100, priceFrom },
  };
}

const publicRouter = express.Router();

publicRouter.get('/', async (req, res) => {
  res.json(await listRooms());
});

publicRouter.get('/:id', async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: Number(req.params.id) || 0 }, select: WITH_PHOTOS });
  if (!room) return res.status(404).json({ error: 'Номер не найден' });
  res.json(toJson(room));
});

publicRouter.get('/:id/photos/:photoId', async (req, res) => {
  const photo = await prisma.roomPhoto.findFirst({
    where: { id: Number(req.params.photoId) || 0, roomId: Number(req.params.id) || 0 },
    select: { data: true, type: true },
  });
  if (!photo) return res.sendStatus(404);
  res.set('Content-Type', photo.type);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(photo.data));
});

publicRouter.get('/:id/photo', async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: Number(req.params.id) || 0 },
    select: { photo: true, photoType: true },
  });
  if (!room?.photo) return res.sendStatus(404);
  res.set('Content-Type', room.photoType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(room.photo));
});

// Карточками номеров управляют все пользователи панели (администратор и редактор)
function adminRouter(requireAdmin) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    res.json(await listRooms(WITH_PHOTOS));
  });

  router.post('/', async (req, res) => {
    const { data, error } = parseRoom(req.body);
    if (error) return res.status(400).json({ error });
    const last = await prisma.room.aggregate({ _max: { sortOrder: true } });
    const room = await prisma.room.create({
      data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      select: FIELDS,
    });
    res.status(201).json(toJson(room));
  });

  router.put('/:id', async (req, res) => {
    const { data, error } = parseRoom(req.body);
    if (error) return res.status(400).json({ error });
    const id = Number(req.params.id) || 0;
    const { count } = await prisma.room.updateMany({ where: { id }, data });
    if (!count) return res.status(404).json({ error: 'Номер не найден' });
    res.json(toJson(await prisma.room.findUnique({ where: { id }, select: FIELDS })));
  });

  router.put('/:id/photo', rawPhoto, async (req, res) => {
    const photo = readPhoto(req);
    if (!photo) return res.status(400).json(PHOTO_ERROR);
    const id = Number(req.params.id) || 0;
    const { count } = await prisma.room.updateMany({ where: { id }, data: { photo: photo.data, photoType: photo.type } });
    if (!count) return res.status(404).json({ error: 'Номер не найден' });
    res.json(toJson(await prisma.room.findUnique({ where: { id }, select: FIELDS })));
  });

  async function roomPhotos(roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, select: WITH_PHOTOS });
    return toJson(room).photos;
  }

  router.post('/:id/photos', rawPhoto, async (req, res) => {
    const photo = readPhoto(req);
    if (!photo) return res.status(400).json(PHOTO_ERROR);
    const roomId = Number(req.params.id) || 0;
    if (!(await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } }))) {
      return res.status(404).json({ error: 'Номер не найден' });
    }
    const last = await prisma.roomPhoto.aggregate({ where: { roomId }, _max: { sortOrder: true } });
    await prisma.roomPhoto.create({ data: { roomId, ...photo, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    res.status(201).json(await roomPhotos(roomId));
  });

  router.post('/:id/photos/:photoId/move', async (req, res) => {
    const roomId = Number(req.params.id) || 0;
    const photos = await prisma.roomPhoto.findMany({ where: { roomId }, select: { id: true }, orderBy: PHOTO_ORDER });
    const index = photos.findIndex((photo) => photo.id === Number(req.params.photoId));
    if (index < 0) return res.status(404).json({ error: 'Фото не найдено' });
    const order = swapped(photos, index, req.body?.direction);
    if (order) {
      await prisma.$transaction(
        order.map((photo, i) => prisma.roomPhoto.update({ where: { id: photo.id }, data: { sortOrder: i + 1 } }))
      );
    }
    res.json(await roomPhotos(roomId));
  });

  router.delete('/:id/photos/:photoId', async (req, res) => {
    const roomId = Number(req.params.id) || 0;
    const { count } = await prisma.roomPhoto.deleteMany({ where: { id: Number(req.params.photoId) || 0, roomId } });
    if (!count) return res.status(404).json({ error: 'Фото не найдено' });
    res.json(await roomPhotos(roomId));
  });

  // Сдвиг карточки на одну позицию вверх или вниз
  router.post('/:id/move', async (req, res) => {
    const rooms = await prisma.room.findMany({ select: { id: true }, orderBy: ORDER });
    const index = rooms.findIndex((room) => room.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Номер не найден' });
    const order = swapped(rooms, index, req.body?.direction);
    if (order) {
      await prisma.$transaction(
        order.map((room, i) => prisma.room.update({ where: { id: room.id }, data: { sortOrder: i + 1 } }))
      );
    }
    res.json(await listRooms(WITH_PHOTOS));
  });

  router.delete('/:id', async (req, res) => {
    const { count } = await prisma.room.deleteMany({ where: { id: Number(req.params.id) || 0 } });
    if (!count) return res.status(404).json({ error: 'Номер не найден' });
    res.sendStatus(204);
  });

  return router;
}

module.exports = { publicRouter, adminRouter };
