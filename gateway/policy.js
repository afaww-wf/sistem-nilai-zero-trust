const db = require('../shared/db');
const config = require('../shared/config');

const allow = (reason) => ({ allow: true, reason });
const deny = (reason, status = 403) => ({ allow: false, reason, status });

function withinAccessHours(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= config.accessStartMin && minutes < config.accessEndMin;
}

const hoursText = `${config.accessStart}-${config.accessEnd}`;

function decide({ auth, method, path, query, device }) {
  // 1) Token service
  if (auth.role === 'service') {
    if (method === 'POST' && path === '/transkrip/sinkron') {
      return allow('token service valid untuk sinkron transkrip');
    }
    return deny('token service hanya boleh mengakses POST /transkrip/sinkron');
  }

  // 2) Token user
  const user = db.prepare('SELECT id, role, nim FROM users WHERE id = ?').get(Number(auth.sub));
  if (!user) return deny('user tidak ditemukan', 401);
  if (user.role !== auth.role) return deny('role pada token tidak sesuai dengan database');

  // 3) Verifikasi konteks
  if (!device) return deny('header X-Device-ID tidak ada');
  const dev = db.prepare('SELECT 1 FROM devices WHERE user_id = ? AND device_id = ?').get(user.id, device);
  if (!dev) return deny('device tidak terdaftar untuk user ini');

  let m;

  // GET /nilai 
  if (method === 'GET' && path === '/nilai') {
    if (user.role === 'mahasiswa') {
      if (query.nim && query.nim !== user.nim) return deny('mahasiswa hanya boleh melihat nilai miliknya sendiri');
      return allow('mahasiswa melihat nilai sendiri');
    }
    if (user.role === 'dosen') {
      if (query.kelas_id) {
        const k = db.prepare('SELECT dosen_id FROM kelas WHERE id = ?').get(Number(query.kelas_id));
        if (!k || k.dosen_id !== user.id) return deny('kelas bukan milik dosen ini');
      }
      return allow('dosen melihat nilai kelas yang diampu');
    }
    return deny(`role ${user.role} tidak boleh melihat nilai`);
  }

  // PUT /nilai/
  if (method === 'PUT' && (m = path.match(/^\/nilai\/(\d+)$/))) {
    if (user.role !== 'dosen') return deny('hanya dosen yang boleh mengubah nilai');
    const row = db
      .prepare('SELECT n.final, k.dosen_id FROM nilai n JOIN kelas k ON k.id = n.kelas_id WHERE n.id = ?')
      .get(Number(m[1]));
    if (!row) return deny('data nilai tidak ditemukan', 404);
    if (row.dosen_id !== user.id) return deny('kelas bukan milik dosen ini');
    if (row.final) return deny('nilai sudah final, tidak dapat diubah');
    if (!withinAccessHours()) return deny(`di luar jam akses (${hoursText})`);
    return allow('dosen mengubah nilai kelas yang diampu');
  }

  // POST /kelas/
  if (method === 'POST' && (m = path.match(/^\/kelas\/(\d+)\/finalisasi$/))) {
    if (user.role !== 'dosen') return deny('hanya dosen yang boleh memfinalisasi nilai');
    const k = db.prepare('SELECT dosen_id FROM kelas WHERE id = ?').get(Number(m[1]));
    if (!k) return deny('kelas tidak ditemukan', 404);
    if (k.dosen_id !== user.id) return deny('kelas bukan milik dosen ini');
    if (!withinAccessHours()) return deny(`di luar jam akses (${hoursText})`);
    return allow('dosen memfinalisasi kelas yang diampu');
  }

  // POST /transkrip/sinkron 
  if (method === 'POST' && path === '/transkrip/sinkron') {
    return deny('endpoint sinkron hanya untuk token service, token user ditolak');
  }

  // GET /transkrip/:nim 
  if (method === 'GET' && (m = path.match(/^\/transkrip\/([A-Za-z0-9]+)$/))) {
    if (user.role === 'admin') return allow('admin melihat transkrip');
    if (user.role === 'mahasiswa') {
      if (m[1] !== user.nim) return deny('mahasiswa hanya boleh melihat transkrip NIM sendiri');
      return allow('mahasiswa melihat transkrip sendiri');
    }
    return deny(`role ${user.role} tidak boleh melihat transkrip`);
  }

  return deny('tidak ada kebijakan untuk endpoint ini (default deny)');
}

module.exports = { decide, withinAccessHours };
