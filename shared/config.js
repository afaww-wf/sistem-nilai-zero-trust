const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function need(name) {
  if (!process.env[name]) throw new Error(`Variabel .env ${name} belum diisi`);
  return process.env[name];
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

const accessStart = process.env.ACCESS_START || '07:00';
const accessEnd = process.env.ACCESS_END || '21:00';

module.exports = {
  ports: {
    gateway: Number(process.env.GATEWAY_PORT) || 3000,
    nilai: Number(process.env.NILAI_PORT) || 3001,
    transkrip: Number(process.env.TRANSKRIP_PORT) || 3002,
  },
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:3000',
  jwtSecret: need('JWT_SECRET'),
  gatewaySecret: need('GATEWAY_SECRET'),
  serviceClientId: need('SERVICE_CLIENT_ID'),
  serviceClientSecret: need('SERVICE_CLIENT_SECRET'),
  accessStart,
  accessEnd,
  accessStartMin: toMinutes(accessStart),
  accessEndMin: toMinutes(accessEnd),
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || './data/sistem-nilai.db'),
  accessTokenTtl: '10m',
  serviceTokenTtl: '5m',
  serviceTokenSeconds: 5 * 60,
  refreshTtlMs: 24 * 60 * 60 * 1000, 
};
