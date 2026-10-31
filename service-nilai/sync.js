const config = require('../shared/config');

let cache = { token: null, expiresAt: 0 };

async function getServiceToken() {
  if (cache.token && Date.now() < cache.expiresAt - 30 * 1000) return cache.token;

  const res = await fetch(`${config.gatewayUrl}/auth/service`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: config.serviceClientId, client_secret: config.serviceClientSecret }),
  });
  if (!res.ok) throw new Error(`Gagal mengambil token service (${res.status})`);
  const data = await res.json();
  cache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cache.token;
}

async function syncTranskrip(payload) {
  const token = await getServiceToken();
  const res = await fetch(`${config.gatewayUrl}/transkrip/sinkron`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Sinkron transkrip gagal (${res.status}): ${await res.text()}`);
  return res.json();
}

module.exports = { syncTranskrip };
