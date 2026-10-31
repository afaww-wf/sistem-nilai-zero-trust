// API Gateway = Policy Enforcement Point (PEP). Satu-satunya pintu masuk (port 3000).
const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../shared/config');
const { decide } = require('./policy');
const { audit } = require('./audit');
const authRoutes = require('./auth');

const app = express();
app.disable('x-powered-by');

app.use('/auth', express.json(), authRoutes);

app.use((req, res, next) => {
  const device = req.get('X-Device-ID');
  const log = (auth, hasil, alasan) =>
    audit({
      subjek: auth ? `${auth.role === 'service' ? 'service' : 'user'}:${auth.sub}` : 'anonymous',
      method: req.method,
      path: req.path,
      device,
      hasil,
      alasan,
    });

  const [type, token] = (req.get('Authorization') || '').split(' ');
  if (type !== 'Bearer' || !token) {
    log(null, 'deny', 'access token tidak ada');
    return res.status(401).json({ error: 'Access token wajib (Authorization: Bearer <token>)' });
  }

  let auth;
  try {
    auth = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    log(null, 'deny', err.name === 'TokenExpiredError' ? 'token kedaluwarsa' : 'token tidak valid');
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }

  const decision = decide({ auth, method: req.method, path: req.path, query: req.query, device });
  log(auth, decision.allow ? 'allow' : 'deny', decision.reason);
  if (!decision.allow) return res.status(decision.status || 403).json({ error: decision.reason });
  next();
});

// service + menambahkan X-Gateway-Secret.
const nilaiUrl = `http://localhost:${config.ports.nilai}`;
const transkripUrl = `http://localhost:${config.ports.transkrip}`;

app.use(
  createProxyMiddleware({
    target: nilaiUrl,
    changeOrigin: true,
    router: (req) => (req.originalUrl.startsWith('/transkrip') ? transkripUrl : nilaiUrl),
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Secret', config.gatewaySecret);
      },
      error: (err, req, res) => {
        if (res && typeof res.writeHead === 'function' && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Service tujuan tidak dapat dihubungi' }));
        }
      },
    },
  })
);

app.listen(config.ports.gateway, () => {
  console.log(`API Gateway (PEP) berjalan di http://localhost:${config.ports.gateway}`);
  console.log(`Jam akses ubah/finalisasi nilai: ${config.accessStart} - ${config.accessEnd}`);
});
