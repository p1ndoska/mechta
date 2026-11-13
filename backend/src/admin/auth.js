const crypto = require('crypto');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const scrypt = promisify(crypto.scrypt);
// Refresh token (в HttpOnly-cookie) живёт 12 часов, access token (JWT) — 15 минут
const SESSION_MS = 12 * 60 * 60 * 1000;
const ACCESS_TTL_SEC = 15 * 60;
// Без JWT_SECRET ключ создаётся при запуске: после перезапуска панель просто обновит access token
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const BCRYPT_ROUNDS = 12;
// bcrypt учитывает только первые 72 байта пароля
const MAX_PASSWORD_BYTES = 72;

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, stored) {
  // Старые хэши scrypt (до перехода на bcrypt) проверяются по-старому и пересохраняются при входе
  if (stored.startsWith('scrypt:')) {
    const [, salt, hex] = stored.split(':');
    const hash = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(hash, Buffer.from(hex, 'hex'));
  }
  return bcrypt.compare(password, stored);
}

function needsRehash(stored) {
  return !stored.startsWith('$2') || bcrypt.getRounds(stored) !== BCRYPT_ROUNDS;
}

// Ошибка проверки нового пароля или null
function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Пароль должен быть не короче 8 символов';
  }
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    return 'Пароль слишком длинный: до 72 латинских символов или 36 русских';
  }
  return null;
}

function createAccessToken(admin) {
  return jwt.sign({ name: admin.name, role: admin.role }, JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(admin.id),
    expiresIn: ACCESS_TTL_SEC,
  });
}

// id пользователя из access token или null, если токен неверный или истёк
function verifyAccessToken(token) {
  try {
    return Number(jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }).sub);
  } catch {
    return null;
  }
}

// В базе хранится только хэш refresh token, сам токен лежит в cookie
function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.adminSession.create({
    data: { token: tokenHash(token), adminId, expiresAt: new Date(Date.now() + SESSION_MS) },
  });
  return token;
}

async function findSession(token) {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { token: tokenHash(token) },
    include: { admin: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

async function deleteSession(token) {
  if (token) await prisma.adminSession.deleteMany({ where: { token: tokenHash(token) } });
}

// Выход на всех устройствах, кроме текущего
async function deleteOtherSessions(adminId, token) {
  await prisma.adminSession.deleteMany({ where: { adminId, NOT: { token: tokenHash(token || '') } } });
}

// Админ по умолчанию создаётся, только если в базе нет ни одного админа
async function ensureDefaultAdmin() {
  if ((await prisma.admin.count()) > 0) return;
  const name = process.env.ADMIN_NAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  await prisma.admin.create({ data: { name, role: 'ADMIN', passwordHash: await hashPassword(password) } });
  console.log(`Создан админ по умолчанию: ${name}`);
}

module.exports = {
  SESSION_MS,
  ACCESS_TTL_SEC,
  createAccessToken,
  verifyAccessToken,
  deleteOtherSessions,
  hashPassword,
  verifyPassword,
  needsRehash,
  passwordError,
  createSession,
  findSession,
  deleteSession,
  ensureDefaultAdmin,
};
