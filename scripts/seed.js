const bcrypt = require('bcryptjs');
const db = require('../shared/db');

db.exec(`
  DROP TABLE IF EXISTS audit_log;
  DROP TABLE IF EXISTS refresh_tokens;
  DROP TABLE IF EXISTS transkrip;
  DROP TABLE IF EXISTS nilai;
  DROP TABLE IF EXISTS kelas;
  DROP TABLE IF EXISTS devices;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mahasiswa','dosen','admin')),
    nim TEXT UNIQUE
  );
  CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL,
    UNIQUE (user_id, device_id)
  );
  CREATE TABLE kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode TEXT NOT NULL,
    nama_mk TEXT NOT NULL,
    dosen_id INTEGER NOT NULL REFERENCES users(id)
  );
  CREATE TABLE nilai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kelas_id INTEGER NOT NULL REFERENCES kelas(id),
    mahasiswa_id INTEGER NOT NULL REFERENCES users(id),
    nilai REAL NOT NULL DEFAULT 0,
    final INTEGER NOT NULL DEFAULT 0,
    UNIQUE (kelas_id, mahasiswa_id)
  );
  CREATE TABLE transkrip (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nim TEXT NOT NULL,
    kelas_id INTEGER NOT NULL,
    mata_kuliah TEXT NOT NULL,
    nilai REAL NOT NULL,
    UNIQUE (nim, kelas_id)
  );
  CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    waktu TEXT NOT NULL,
    subjek TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    device TEXT,
    hasil TEXT NOT NULL,
    alasan TEXT NOT NULL
  );
`);

const PASSWORD = 'password123';
const hash = bcrypt.hashSync(PASSWORD, 10);

const addUser = db.prepare(
  'INSERT INTO users (username, password_hash, nama, role, nim) VALUES (?, ?, ?, ?, ?)'
);
const addDevice = db.prepare('INSERT INTO devices (user_id, device_id) VALUES (?, ?)');

const users = [
  { username: 'admin1', nama: 'Admin Prodi', role: 'admin', nim: null, device: 'dev-admin-1' },
  { username: 'dosen1', nama: 'Dosen Satu', role: 'dosen', nim: null, device: 'dev-dosen-1' },
  { username: 'dosen2', nama: 'Dosen Dua', role: 'dosen', nim: null, device: 'dev-dosen-2' },
  { username: 'mhs1', nama: 'Mahasiswa Satu', role: 'mahasiswa', nim: '20241', device: 'dev-mhs-1' },
  { username: 'mhs2', nama: 'Mahasiswa Dua', role: 'mahasiswa', nim: '20242', device: 'dev-mhs-2' },
  { username: 'mhs3', nama: 'Mahasiswa Tiga', role: 'mahasiswa', nim: '20243', device: 'dev-mhs-3' },
];

const id = {};
for (const u of users) {
  id[u.username] = addUser.run(u.username, hash, u.nama, u.role, u.nim).lastInsertRowid;
  addDevice.run(id[u.username], u.device);
}

// 2 kelas dengan dosen berbeda
const addKelas = db.prepare('INSERT INTO kelas (kode, nama_mk, dosen_id) VALUES (?, ?, ?)');
const kelas1 = addKelas.run('IF101', 'Keamanan Informasi', id.dosen1).lastInsertRowid;
const kelas2 = addKelas.run('IF102', 'Basis Data', id.dosen2).lastInsertRowid;

// Semua mahasiswa terdaftar di kedua kelas.
const addNilai = db.prepare('INSERT INTO nilai (kelas_id, mahasiswa_id, nilai) VALUES (?, ?, ?)');
const awal = { mhs1: [80, 75], mhs2: [70, 85], mhs3: [90, 65] };
[kelas1, kelas2].forEach((k, idx) => {
  for (const m of ['mhs1', 'mhs2', 'mhs3']) addNilai.run(k, id[m], awal[m][idx]);
});

console.log('Seed selesai. Password semua akun:', PASSWORD);
console.table(users.map((u) => ({ username: u.username, role: u.role, nim: u.nim || '-', 'X-Device-ID': u.device })));
