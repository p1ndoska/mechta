const crypto = require('crypto');
const { promisify } = require('util');
const prisma = require('../prisma');

const scrypt = promisify(crypto.scrypt);
const SESSION_MS = 12 * 60 * 60 * 1000;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [, salt, hex] = stored.split(':');
  const hash = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hex, 'hex'));
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
  createSession,
  findSession,
  deleteSession,
  ensureDefaultAdmin,
};
