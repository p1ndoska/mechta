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
  };
}

async function listRooms() {
  const rooms = await prisma.room.findMany({ select: FIELDS, orderBy: ORDER });
  return rooms.map(toJson);
}

function parseRoom(body) {
  const { title, description = '', price, priceFrom = false } = body ?? {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
    return { error: 'Название: от 1 до 100 символов' };
  }
  if (typeof description !== 'string' || description.length > 500) {
    return { error: 'Описание: не длиннее 500 символов' };
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
    res.json(await listRooms());
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

  router.put(
    '/:id/photo',
    express.raw({ type: Object.keys(PHOTO_TYPES), limit: '10mb' }),
    async (req, res) => {
      const type = req.get('content-type');
      const check = PHOTO_TYPES[type];
      if (!check || !Buffer.isBuffer(req.body) || !check(req.body)) {
        return res.status(400).json({ error: 'Фото должно быть в формате JPEG, PNG или WebP' });
      }
      const id = Number(req.params.id) || 0;
      const { count } = await prisma.room.updateMany({ where: { id }, data: { photo: req.body, photoType: type } });
      if (!count) return res.status(404).json({ error: 'Номер не найден' });
      res.json(toJson(await prisma.room.findUnique({ where: { id }, select: FIELDS })));
    }
  );

  // Сдвиг карточки на одну позицию вверх или вниз
  router.post('/:id/move', async (req, res) => {
    const rooms = await prisma.room.findMany({ select: { id: true }, orderBy: ORDER });
    const index = rooms.findIndex((room) => room.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Номер не найден' });
    const target = index + (req.body?.direction === 'up' ? -1 : 1);
    if (target >= 0 && target < rooms.length) {
      [rooms[index], rooms[target]] = [rooms[target], rooms[index]];
      await prisma.$transaction(
        rooms.map((room, i) => prisma.room.update({ where: { id: room.id }, data: { sortOrder: i + 1 } }))
      );
    }
    res.json(await listRooms());
  });

  router.delete('/:id', async (req, res) => {
    const { count } = await prisma.room.deleteMany({ where: { id: Number(req.params.id) || 0 } });
    if (!count) return res.status(404).json({ error: 'Номер не найден' });
    res.sendStatus(204);
  });

  return router;
}

module.exports = { publicRouter, adminRouter };
