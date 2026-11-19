const express = require('express');
const nodemailer = require('nodemailer');
const prisma = require('./prisma');
const { clientIp } = require('./admin/ipAllow');

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const sent = new Map();

// Почта для заявок задаётся в .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, BOOKING_EMAIL
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, BOOKING_EMAIL } = process.env;
const port = Number(SMTP_PORT) || 465;
const transport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    })
  : null;

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

const ruDate = (d) => d.toISOString().slice(0, 10).split('-').reverse().join('.');

async function parseBooking(body) {
  const b = body ?? {};
  const firstName = text(b.firstName, 60);
  const lastName = text(b.lastName, 60);
  if (!firstName || !lastName) return { error: 'name' };
  const email = text(b.email, 120);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'email' };
  const phone = text(b.phone ?? '', 30);
  if (phone === null || (phone && !/^\+?[\d\s()-]{5,}$/.test(phone))) return { error: 'phone' };
  const room = await prisma.room.findUnique({ where: { id: Number(b.roomId) || 0 }, select: { titleRu: true } });
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
  return { data: { firstName, lastName, email, phone, room: room.titleRu, tariff, checkIn, checkOut, wishes } };
}

function letter(d) {
  const lines = [
    ['Имя', d.firstName],
    ['Фамилия', d.lastName],
    ['Email', d.email],
    ['Телефон', d.phone || '—'],
    ['Категория', d.room],
    ['Тариф', d.tariff || '—'],
    ['Дата заезда', ruDate(d.checkIn)],
    ['Дата выезда', ruDate(d.checkOut)],
    ['Пожелания', d.wishes || '—'],
  ];
  return {
    subject: `Заявка на бронирование: ${d.room}, ${ruDate(d.checkIn)} — ${ruDate(d.checkOut)}`,
    text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'),
  };
}

const publicRouter = express.Router();

// Заявка не сохраняется: письмо уходит на BOOKING_EMAIL, код ошибки (error) переводится во frontend
publicRouter.post('/', async (req, res) => {
  const { data, error } = await parseBooking(req.body);
  if (error) return res.status(400).json({ error });
  if (!transport || !BOOKING_EMAIL) {
    console.error('Заявка не отправлена: не заданы SMTP_HOST или BOOKING_EMAIL в .env');
    return res.status(503).json({ error: 'failed' });
  }
  if (tooMany(clientIp(req))) return res.status(429).json({ error: 'tooMany' });
  try {
    await transport.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: BOOKING_EMAIL,
      replyTo: data.email,
      ...letter(data),
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Заявка не отправлена:', err.message);
    res.status(502).json({ error: 'failed' });
  }
});

module.exports = { publicRouter };
