const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('./config');

function secretValid(received) {
  const a = Buffer.from(String(received || ''));
  const b = Buffer.from(config.gatewaySecret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function guard(allowedRoles) {
  return (req, res, next) => {
    if (!secretValid(req.get('X-Gateway-Secret'))) {
      return res.status(403).json({ error: 'Akses langsung ditolak: X-Gateway-Secret tidak valid' });
    }

    const [type, token] = (req.get('Authorization') || '').split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token tidak ada (ditolak oleh service)' });
    }

    try {
      req.auth = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa (ditolak oleh service)' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: `Role '${req.auth.role}' tidak diizinkan di service ini` });
    }
    next();
  };
}

module.exports = { guard };
