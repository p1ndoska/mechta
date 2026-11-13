const net = require('net');

// Список разрешённых адресов для /administrator: IP или подсети через запятую (ADMIN_ALLOWED_IPS)
const DEFAULT_ALLOWED = '127.0.0.1,::1';

function normalize(ip) {
  return ip?.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function parseList(value) {
  const list = new net.BlockList();
  for (const raw of value.split(',')) {
    const entry = raw.trim();
    if (!entry) continue;
    const [addr, prefix] = entry.split('/');
    const type = net.isIPv6(addr) ? 'ipv6' : 'ipv4';
    if (!net.isIP(addr)) {
      console.warn('ADMIN_ALLOWED_IPS: неверный адрес', entry);
      continue;
    }
    if (prefix) list.addSubnet(addr, Number(prefix), type);
    else list.addAddress(addr, type);
  }
  return list;
}

const allowed = parseList(process.env.ADMIN_ALLOWED_IPS || DEFAULT_ALLOWED);

// За nginx реальный адрес клиента приходит в X-Real-IP
function clientIp(req) {
  return normalize(req.get('x-real-ip') || req.socket.remoteAddress);
}

function isAllowed(ip) {
  if (!net.isIP(ip)) return false;
  return allowed.check(ip, net.isIPv6(ip) ? 'ipv6' : 'ipv4');
}

function ipGuard(req, res, next) {
  const ip = clientIp(req);
  if (isAllowed(ip)) return next();
  console.warn('Админка: доступ запрещён для', ip);
  res.status(403).json({ error: 'forbidden', ip });
}

module.exports = { ipGuard, clientIp };
