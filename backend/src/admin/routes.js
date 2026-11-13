const express = require('express');
const prisma = require('../prisma');
const { ipGuard, clientIp } = require('./ipAllow');
const auth = require('./auth');

const COOKIE = 'admin_session';
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map();

const router = express.Router();

router.use(ipGuard);

// nginx проверяет здесь IP перед тем, как отдать страницу /administrator
router.get('/ip-check', (req, res) => res.sendStatus(204));

function readToken(req) {
  const cookies = req.get('cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]+)`));
  return match?.[1];
}

function setCookie(res, token, maxAgeMs) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(maxAgeMs / 1000)}`
  );
}

async function requireAdmin(req, res, next) {
  const session = await auth.findSession(readToken(req));
  if (!session) return res.status(401).json({ error: 'unauthorized' });
  req.admin = session.admin;
  next();
}

// Управлять пользователями может только роль «Администратор»
function requireRoleAdmin(req, res, next) {
  if (req.admin.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Управлять пользователями может только администратор' });
  }
  next();
}

router.post('/login', async (req, res) => {
  const ip = clientIp(req);
  const fail = fails.get(ip);
  if (fail && fail.count >= MAX_FAILS && Date.now() - fail.at < LOCK_MS) {
    return res.status(429).json({ error: 'Слишком много попыток, попробуйте через 15 минут' });
  }

  const { name, password } = req.body ?? {};
  const admin =
    typeof name === 'string' && typeof password === 'string'
      ? await prisma.admin.findUnique({ where: { name } })
      : null;
  if (!admin || !(await auth.verifyPassword(password, admin.passwordHash))) {
    const count = fail && Date.now() - fail.at < LOCK_MS ? fail.count + 1 : 1;
    fails.set(ip, { count, at: Date.now() });
    return res.status(401).json({ error: 'Неверное имя или пароль' });
  }

  fails.delete(ip);
  setCookie(res, await auth.createSession(admin.id), auth.SESSION_MS);
  res.json({ name: admin.name, role: admin.role });
});

router.post('/logout', async (req, res) => {
  await auth.deleteSession(readToken(req));
  setCookie(res, '', 0);
  res.sendStatus(204);
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ name: req.admin.name, role: req.admin.role });
});

router.post('/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Заполните оба поля' });
  }
  if (!(await auth.verifyPassword(currentPassword, req.admin.passwordHash))) {
    return res.status(400).json({ error: 'Текущий пароль неверный' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Новый пароль должен быть не короче 8 символов' });
  }
  await prisma.admin.update({
    where: { id: req.admin.id },
    data: { passwordHash: await auth.hashPassword(newPassword) },
  });
  res.sendStatus(204);
});

const NAME_RE = /^[\p{L}\p{N}._-]{3,32}$/u;
const ROLES = ['ADMIN', 'EDITOR'];
const USER_FIELDS = { id: true, name: true, role: true, createdAt: true };

router.get('/users', requireAdmin, requireRoleAdmin, async (req, res) => {
  const users = await prisma.admin.findMany({ select: USER_FIELDS, orderBy: { id: 'asc' } });
  res.json(users);
});

router.post('/users', requireAdmin, requireRoleAdmin, async (req, res) => {
  const { name, password, role } = req.body ?? {};
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return res
      .status(400)
      .json({ error: 'Имя: от 3 до 32 символов — буквы, цифры, точка, дефис или подчёркивание, без пробелов' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Выберите роль' });
  }
  if (await prisma.admin.findUnique({ where: { name } })) {
    return res.status(400).json({ error: 'Пользователь с таким именем уже есть' });
  }
  const user = await prisma.admin.create({
    data: { name, role, passwordHash: await auth.hashPassword(password) },
    select: USER_FIELDS,
  });
  res.status(201).json(user);
});

router.delete('/users/:id', requireAdmin, requireRoleAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.admin.id) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }
  const { count } = await prisma.admin.deleteMany({ where: { id } });
  if (!count) return res.status(404).json({ error: 'Пользователь не найден' });
  res.sendStatus(204);
});

module.exports = router;
