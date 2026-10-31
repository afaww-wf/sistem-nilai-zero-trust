// Service Transkrip (port 3002) 
const express = require('express');
const config = require('../shared/config');
const db = require('../shared/db');
const { guard } = require('../shared/serviceGuard');

const app = express();
app.use(express.json());

// POST /transkrip/sinkron 
app.post('/transkrip/sinkron', guard(['service']), (req, res) => {
  const { kelas_id, mata_kuliah, entries } = req.body || {};
  if (!Number.isInteger(kelas_id) || !mata_kuliah || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Body harus berisi kelas_id, mata_kuliah, entries[]' });
  }
  const upsert = db.prepare(
    `INSERT INTO transkrip (nim, kelas_id, mata_kuliah, nilai) VALUES (?, ?, ?, ?)
     ON CONFLICT (nim, kelas_id) DO UPDATE SET nilai = excluded.nilai, mata_kuliah = excluded.mata_kuliah`
  );
  db.transaction(() => {
    for (const e of entries) upsert.run(String(e.nim), kelas_id, mata_kuliah, Number(e.nilai));
  })();
  res.json({ message: 'Transkrip disinkronkan', jumlah: entries.length });
});

// GET /transkrip/:nim 
app.get('/transkrip/:nim', guard(['mahasiswa', 'admin']), (req, res) => {
  if (req.auth.role === 'mahasiswa' && req.auth.nim !== req.params.nim) {
    return res.status(403).json({ error: 'Mahasiswa hanya boleh melihat transkrip NIM sendiri' });
  }
  const rows = db
    .prepare('SELECT nim, kelas_id, mata_kuliah, nilai FROM transkrip WHERE nim = ? ORDER BY kelas_id')
    .all(req.params.nim);
  res.json({ nim: req.params.nim, transkrip: rows });
});

app.listen(config.ports.transkrip, () => console.log(`Service Transkrip berjalan di port ${config.ports.transkrip}`));
