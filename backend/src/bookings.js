const express = require('express');
const prisma = require('./prisma');
const { clientIp } = require('./admin/ipAllow');

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const sent = new Map();

// Не больше 5 заявок с одного IP за 10 минут
function tooMany(ip) {
  const now = Date.now();
  const recent = (sent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return true;
  recent.push(now);
  sent.set(ip, recent);
  return false;
}

function text(value, max) {
  return typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
}

// Дата в формате ГГГГ-ММ-ДД или null
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

async function parseBooking(body) {
  const b = body ?? {};
  const firstName = text(b.firstName, 60);
  const lastName = text(b.lastName, 60);
  if (!firstName || !lastName) return { error: 'name' };
  const email = text(b.email, 120);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'email' };
  const phone = text(b.phone ?? '', 30);
  if (phone === null || (phone && !/^\+?[\d\s()-]{5,}$/.test(phone))) return { error: 'phone' };
  const room = await prisma.room.findUnique({ where: { id: Number(b.roomId) || 0 }, select: { id: true, titleRu: true } });
  if (!room) return { error: 'room' };
  const tariff = text(b.tariff ?? '', 120);
  if (tariff === null) return { error: 'tariff' };
  const checkIn = date(b.checkIn);
  const checkOut = date(b.checkOut);
  // День запаса на разницу часовых поясов гостя и сервера
  if (!checkIn || checkIn.getTime() < Date.now() - 2 * DAY_MS) return { error: 'checkIn' };
  if (!checkOut || checkOut <= checkIn || checkOut - checkIn > 365 * DAY_MS) return { error: 'checkOut' };
  const wishes = text(b.wishes ?? '', 1000);
  if (wishes === null) return { error: 'wishes' };
  if (b.consent !== true) return { error: 'consent' };
  return {
    data: { firstName, lastName, email, phone, roomId: room.id, roomTitle: room.titleRu, tariff, checkIn, checkOut, wishes },
  };
}

function toJson(r) {
  return { ...r, checkIn: r.checkIn.toISOString().slice(0, 10), checkOut: r.checkOut.toISOString().slice(0, 10) };
}

async function list() {
  return (await prisma.bookingRequest.findMany({ orderBy: { id: 'desc' } })).map(toJson);
}

const publicRouter = express.Router();

// Код ошибки (error) переводится на язык сайта во frontend
publicRouter.post('/', async (req, res) => {
  const { data, error } = await parseBooking(req.body);
  if (error) return res.status(400).json({ error });
  if (tooMany(clientIp(req))) return res.status(429).json({ error: 'tooMany' });
  await prisma.bookingRequest.create({ data });
  res.status(201).json({ ok: true });
});

// Заявки видят все пользователи панели (администратор и редактор)
function adminRouter(requireAdmin) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    res.json(await list());
  });

  router.put('/:id', async (req, res) => {
    if (typeof req.body?.done !== 'boolean') return res.status(400).json({ error: 'done: true или false' });
    const { count } = await prisma.bookingRequest.updateMany({
      where: { id: Number(req.params.id) || 0 },
      data: { done: req.body.done },
    });
    if (!count) return res.status(404).json({ error: 'Заявка не найдена' });
    res.json(await list());
  });

  router.delete('/:id', async (req, res) => {
    const { count } = await prisma.bookingRequest.deleteMany({ where: { id: Number(req.params.id) || 0 } });
    if (!count) return res.status(404).json({ error: 'Заявка не найдена' });
    res.json(await list());
  });

  return router;
}

module.exports = { publicRouter, adminRouter };
