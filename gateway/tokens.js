const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../shared/db');
const config = require('../shared/config');

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');

function createAccessToken(user) {
  const payload = { sub: String(user.id), role: user.role };
  if (user.nim) payload.nim = user.nim;
  return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.accessTokenTtl });
}

function createServiceToken(clientId) {
  return jwt.sign({ sub: clientId, role: 'service' }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.serviceTokenTtl,
  });
}

function createRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(
    userId,
    sha256(token),
    Date.now() + config.refreshTtlMs
  );
  return token;
}

function findValidRefresh(token) {
  return db
    .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > ?')
    .get(sha256(String(token || '')), Date.now());
}

function revokeRefresh(token) {
  return db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(sha256(String(token || '')));
}

module.exports = { createAccessToken, createServiceToken, createRefreshToken, findValidRefresh, revokeRefresh };
