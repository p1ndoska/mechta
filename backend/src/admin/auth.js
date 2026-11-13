const crypto = require('crypto');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

const scrypt = promisify(crypto.scrypt);
const SESSION_MS = 12 * 60 * 60 * 1000;
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

// В базе хранится только хэш токена, сам токен лежит в cookie
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
  hashPassword,
  verifyPassword,
  needsRehash,
  passwordError,
  createSession,
  findSession,
  deleteSession,
  ensureDefaultAdmin,
};
