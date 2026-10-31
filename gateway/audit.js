// Audit log: setiap keputusan akses dicatat ke tabel audit_log + console.
const db = require('../shared/db');

const insert = db.prepare(
  'INSERT INTO audit_log (waktu, subjek, endpoint, device, hasil, alasan) VALUES (?, ?, ?, ?, ?, ?)'
);

function audit({ subjek, method, path, device, hasil, alasan }) {
  const waktu = new Date().toISOString();
  const endpoint = `${method} ${path}`;
  insert.run(waktu, subjek || 'anonymous', endpoint, device || '-', hasil, alasan);
  console.log(`[AUDIT] ${waktu} | ${subjek || 'anonymous'} | ${endpoint} | ${device || '-'} | ${hasil.toUpperCase()} | ${alasan}`);
}

module.exports = { audit };
