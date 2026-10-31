// Service Nilai (port 3001) 
const express = require('express');
const config = require('../shared/config');
const db = require('../shared/db');
const { guard } = require('../shared/serviceGuard');
const { syncTranskrip } = require('./sync');

const app = express();
app.use(express.json());

// GET /nilai 
app.get('/nilai', guard(['mahasiswa', 'dosen']), (req, res) => {
  const base = `SELECT n.id, n.kelas_id, k.nama_mk, u.nim, u.nama, n.nilai, n.final
                FROM nilai n
                JOIN kelas k ON k.id = n.kelas_id
                JOIN users u ON u.id = n.mahasiswa_id`;
  const userId = Number(req.auth.sub);
  let rows;
  if (req.auth.role === 'mahasiswa') {
    rows = db.prepare(`${base} WHERE n.mahasiswa_id = ?`).all(userId);
  } else if (req.query.kelas_id) {
    rows = db.prepare(`${base} WHERE k.dosen_id = ? AND n.kelas_id = ?`).all(userId, Number(req.query.kelas_id));
  } else {
    rows = db.prepare(`${base} WHERE k.dosen_id = ?`).all(userId);
  }
  res.json(rows);
});

// PUT /nilai/:id 
app.put('/nilai/:id', guard(['dosen']), (req, res) => {
  const nilai = Number((req.body || {}).nilai);
  if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
    return res.status(400).json({ error: 'nilai harus angka 0-100' });
  }
  const row = db
    .prepare('SELECT n.id, n.final, k.dosen_id FROM nilai n JOIN kelas k ON k.id = n.kelas_id WHERE n.id = ?')
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Data nilai tidak ditemukan' });
  if (row.dosen_id !== Number(req.auth.sub)) return res.status(403).json({ error: 'Kelas bukan milik dosen ini' });
  if (row.final) return res.status(403).json({ error: 'Nilai sudah final' });

  db.prepare('UPDATE nilai SET nilai = ? WHERE id = ?').run(nilai, row.id);
  res.json({ message: 'Nilai diperbarui', id: row.id, nilai });
});

// POST /kelas/:id/finalisasi 
app.post('/kelas/:id/finalisasi', guard(['dosen']), async (req, res) => {
  const kelasId = Number(req.params.id);
  const kelas = db.prepare('SELECT * FROM kelas WHERE id = ?').get(kelasId);
  if (!kelas) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
  if (kelas.dosen_id !== Number(req.auth.sub)) return res.status(403).json({ error: 'Kelas bukan milik dosen ini' });

  const rows = db
    .prepare(
      `SELECT n.id, n.final, u.nim, n.nilai FROM nilai n
       JOIN users u ON u.id = n.mahasiswa_id WHERE n.kelas_id = ?`
    )
    .all(kelasId);
  if (rows.length === 0) return res.status(404).json({ error: 'Kelas belum punya data nilai' });

  const belumFinal = rows.filter((r) => !r.final).map((r) => r.id);
  const setFinal = db.prepare('UPDATE nilai SET final = ? WHERE id = ?');
  db.transaction((ids, v) => ids.forEach((id) => setFinal.run(v, id)))(belumFinal, 1);

  try {
    await syncTranskrip({
      kelas_id: kelasId,
      mata_kuliah: kelas.nama_mk,
      entries: rows.map((r) => ({ nim: r.nim, nilai: r.nilai })),
    });
  } catch (err) {
    // Sinkron gagal 
    db.transaction((ids, v) => ids.forEach((id) => setFinal.run(v, id)))(belumFinal, 0);
    console.error(err.message);
    return res.status(502).json({ error: 'Sinkron ke Service Transkrip gagal, finalisasi dibatalkan' });
  }

  res.json({ message: 'Kelas difinalisasi dan transkrip disinkronkan', kelas_id: kelasId, jumlah_nilai: rows.length });
});

app.listen(config.ports.nilai, () => console.log(`Service Nilai berjalan di port ${config.ports.nilai}`));
