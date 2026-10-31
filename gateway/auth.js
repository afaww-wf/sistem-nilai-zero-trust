// Endpoint /auth/* ditangani langsung oleh gateway (Policy Administrator).
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../shared/db');
const config = require('../shared/config');
const { audit } = require('./audit');
const tokens = require('./tokens');

const router = express.Router();

const rec = (req, subjek, hasil, alasan) =>
  audit({ subjek, method: req.method, path: req.originalUrl, device: req.get('X-Device-ID'), hasil, alasan });

// POST /auth/login  -> kredensial valid + device terdaftar
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const device = req.get('X-Device-ID');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || ''));

  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    rec(req, `user:${username || '?'}`, 'deny', 'kredensial salah');
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  if (!device) {
    rec(req, `user:${user.id}`, 'deny', 'header X-Device-ID tidak ada');
    return res.status(403).json({ error: 'Header X-Device-ID wajib' });
  }
  const dev = db.prepare('SELECT 1 FROM devices WHERE user_id = ? AND device_id = ?').get(user.id, device);
  if (!dev) {
    rec(req, `user:${user.id}`, 'deny', 'device tidak terdaftar untuk user ini');
    return res.status(403).json({ error: 'Device tidak terdaftar untuk user ini' });
  }

  rec(req, `user:${user.id}`, 'allow', 'login berhasil');
  res.json({
    access_token: tokens.createAccessToken(user),
    refresh_token: tokens.createRefreshToken(user.id),
    token_type: 'Bearer',
    expires_in: 600,
  });
});

// POST /auth/refresh -> refresh token valid & belum dicabut
router.post('/refresh', (req, res) => {
  const row = tokens.findValidRefresh((req.body || {}).refresh_token);
  if (!row) {
    rec(req, 'anonymous', 'deny', 'refresh token tidak valid, kedaluwarsa, atau sudah dicabut');
    return res.status(401).json({ error: 'Refresh token tidak valid' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  rec(req, `user:${user.id}`, 'allow', 'access token diperbarui');
  res.json({ access_token: tokens.createAccessToken(user), token_type: 'Bearer', expires_in: 600 });
});

// POST /auth/logout -> cabut refresh token
router.post('/logout', (req, res) => {
  const row = tokens.findValidRefresh((req.body || {}).refresh_token);
  if (!row) {
    rec(req, 'anonymous', 'deny', 'refresh token tidak valid atau sudah dicabut');
    return res.status(401).json({ error: 'Refresh token tidak valid' });
  }
  tokens.revokeRefresh(req.body.refresh_token);
  rec(req, `user:${row.user_id}`, 'allow', 'refresh token dicabut (logout)');
  res.json({ message: 'Logout berhasil, refresh token dicabut' });
});

// POST /auth/service -> token service (5 menit, role: service) untuk Service Nilai
router.post('/service', (req, res) => {
  const { client_id, client_secret } = req.body || {};
  if (client_id !== config.serviceClientId || client_secret !== config.serviceClientSecret) {
    rec(req, `service:${client_id || '?'}`, 'deny', 'client id/secret tidak valid');
    return res.status(401).json({ error: 'Client ID atau secret tidak valid' });
  }
  rec(req, `service:${client_id}`, 'allow', 'token service diterbitkan');
  res.json({
    access_token: tokens.createServiceToken(client_id),
    token_type: 'Bearer',
    expires_in: config.serviceTokenSeconds,
  });
});

module.exports = router;
