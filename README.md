# 🔐 SISTEM NILAI — ZERO TRUST SECURITY

### Backend Application | Informatika — Universitas Siliwangi

Nama: Wafa Faujiah
NPM: 247006111026
Kelas: A
Tugas Praktikum Individu
---

## 📌 1. DESKRIPSI PROYEK

Sistem Nilai — Zero Trust Security merupakan aplikasi backend untuk mengelola data nilai dan transkrip mahasiswa dengan menerapkan prinsip **Zero Trust Security**.

Prinsip Zero Trust mengutamakan verifikasi setiap permintaan akses sebelum memberikan izin kepada pengguna atau layanan untuk mengakses sumber daya. Sistem ini menggunakan API Gateway sebagai **Policy Enforcement Point (PEP)** yang memeriksa permintaan berdasarkan autentikasi, otorisasi, identitas perangkat, dan kebijakan akses.

Arsitektur sistem mengacu pada konsep **Zero Trust Architecture dalam NIST SP 800-207**.

### 🎯 Tujuan Proyek

1. Menerapkan autentikasi pengguna menggunakan access token dan refresh token.
2. Menerapkan otorisasi berdasarkan role dan kebijakan akses.
3. Memvalidasi identitas perangkat melalui header `X-Device-ID`.
4. Membatasi akses mahasiswa terhadap data nilai sesuai haknya.
5. Membatasi akses dosen berdasarkan kelas yang menjadi tanggung jawabnya.
6. Mengamankan komunikasi antara API Gateway dan layanan internal.
7. Menerapkan autentikasi khusus untuk komunikasi antarlayanan.
8. Mencegah akses langsung yang tidak sah ke layanan internal.
9. Mencatat aktivitas akses melalui mekanisme audit log.

---

## 🏗️ 2. ARSITEKTUR SISTEM

Sistem terdiri dari Client, API Gateway, Service Nilai, Service Transkrip, dan database SQLite bersama.

```text
                     CLIENT
                    (Postman)
                        |
                        v
             +----------------------+
             |    API GATEWAY       |
             |       Port 3000      |
             |                      |
             | - Policy Enforcement |
             |   Point (PEP)        |
             | - Policy Engine      |
             | - Authentication     |
             | - Audit Log          |
             +----------------------+
                   |          |
           /nilai, /kelas     /transkrip
                   |          |
                   v          v
          +-------------+  +----------------+
          | Service     |  | Service        |
          | Nilai       |  | Transkrip      |
          | Port 3001   |  | Port 3002      |
          +-------------+  +----------------+
                   |          |
                   +-----+----+
                         |
                         v
              +----------------------+
              |    Database SQLite   |
              | data/sistem-nilai.db |
              +----------------------+
```

### 🔄 Alur Sinkronisasi Transkrip

Finalisasi nilai memicu proses sinkronisasi antara Service Nilai dan Service Transkrip melalui API Gateway menggunakan autentikasi service.

```text
Service Nilai
     |
     | Token Service
     v
API Gateway
     |
     | Permintaan sinkronisasi
     v
Service Transkrip
     |
     v
/transkrip/sinkron
```

### Komponen Sistem

| Komponen | Port | Fungsi |
|---|---:|---|
| API Gateway | 3000 | Pintu masuk permintaan, autentikasi, kebijakan akses, dan audit |
| Service Nilai | 3001 | Mengelola data nilai dan kelas |
| Service Transkrip | 3002 | Mengelola akses dan sinkronisasi transkrip |
| Database SQLite | - | Menyimpan data aplikasi |

---

## 💻 3. TEKNOLOGI YANG DIGUNAKAN

| Teknologi | Fungsi |
|---|---|
| Node.js | Menjalankan aplikasi backend |
| JavaScript | Bahasa pemrograman |
| Express.js | Framework HTTP jika digunakan oleh implementasi service |
| SQLite | Database untuk menyimpan data |
| JWT | Mekanisme token autentikasi sesuai implementasi |
| Postman | Pengujian API |
| Visual Studio Code | Editor kode |
| JSON | Format pertukaran data |
| dotenv | Pengelolaan environment jika digunakan |

### Persyaratan Sistem

- Node.js versi 18 atau lebih baru.
- Node.js 20 LTS direkomendasikan dalam dokumentasi proyek.
- npm.
- Visual Studio Code.
- Postman.

---

## 📁 4. STRUKTUR DIREKTORI

Berikut struktur direktori utama berdasarkan file yang digunakan dalam proyek.

```text
sistem-nilai/
│
├── gateway/
│   ├── index.js
│   ├── auth.js
│   ├── tokens.js
│   ├── policy.js
│   └── audit.js
│
├── service-nilai/
│   └── sync.js
│
├── shared/
│   └── serviceGuard.js
│
├── scripts/
│   └── seed.js
│
├── postman/
│   └── sistem-nilai.postman_collection.json
│
├── data/
│   └── sistem-nilai.db
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

*Catatan: struktur tersebut merangkum file yang tercantum dalam dokumentasi proyek. Sesuaikan dengan isi folder yang sebenarnya.*

### Fungsi File Utama

| File | Keterangan |
|---|---|
| `gateway/index.js` | Gateway dan routing permintaan |
| `gateway/auth.js` | Login, validasi perangkat, dan logout |
| `gateway/tokens.js` | Pengelolaan access token, refresh token, dan token service |
| `gateway/policy.js` | Pemeriksaan kebijakan akses |
| `gateway/audit.js` | Pencatatan aktivitas akses |
| `shared/serviceGuard.js` | Pemeriksaan keamanan layanan internal |
| `service-nilai/sync.js` | Mendukung komunikasi sinkronisasi antarlayanan |
| `scripts/seed.js` | Pembuatan tabel dan data awal |
| `postman/sistem-nilai.postman_collection.json` | Koleksi request untuk pengujian API |

---

## ⚙️ 5. INSTALASI DAN KONFIGURASI

### 5.1. Memeriksa Node.js dan npm

Buka terminal di Visual Studio Code, kemudian jalankan:

```bash
node -v
npm -v
```

Pastikan Node.js dan npm sudah terpasang.

### 5.2. Membuka Folder Proyek

Masuk ke direktori utama proyek:

```powershell
cd D:\sistem-nilai\sistem-nilai
```

Sesuaikan path dengan lokasi penyimpanan proyek.

### 5.3. Menginstal Dependensi

Jalankan:

```bash
npm install
```

Perintah tersebut menginstal dependensi yang dibutuhkan oleh aplikasi berdasarkan `package.json`.

### 5.4. Mengatur Environment

Pastikan file `.env` tersedia di direktori utama proyek.

Jika belum tersedia, salin `.env.example` menjadi `.env`, lalu isi variabel yang diperlukan sesuai implementasi backend.

Contoh nama konfigurasi:

```env
JWT_SECRET=isi_dengan_secret_jwt
GATEWAY_SECRET=isi_dengan_secret_gateway
ACCESS_START=08:00
ACCESS_END=17:00
```

**Perhatian:** contoh di atas hanya ilustrasi. Nama variabel, format waktu, dan nilai yang digunakan harus sesuai dengan konfigurasi aktual proyek.

Jangan menganggap `JWT_SECRET`, `GATEWAY_SECRET`, dan kredensial service sebagai nilai yang sama. Jangan membagikan secret yang sebenarnya atau mengunggahnya ke repository publik.

### 5.5. Membuat Tabel dan Data Awal

Jalankan:

```bash
npm run seed
```

Perintah ini digunakan untuk membuat tabel database dan memasukkan data awal sesuai implementasi `scripts/seed.js`.

Pastikan proses seed selesai tanpa error.

### 5.6. Menjalankan Aplikasi

Jalankan:

```bash
npm start
```

Perintah tersebut digunakan untuk menjalankan API Gateway, Service Nilai, dan Service Transkrip sekaligus.

Biarkan terminal tetap aktif selama pengujian.

---

## 👥 6. AKUN PENGUJIAN

Akun berikut merupakan data seed yang disediakan untuk pengujian lokal.

**Password seluruh akun: `password123`**

| Username | Role | NIM | X-Device-ID |
|---|---|---|---|
| `admin1` | Admin | - | `dev-admin-1` |
| `dosen1` | Dosen | - | `dev-dosen-1` |
| `dosen2` | Dosen | - | `dev-dosen-2` |
| `mhs1` | Mahasiswa | `20241` | `dev-mhs-1` |
| `mhs2` | Mahasiswa | `20242` | `dev-mhs-2` |
| `mhs3` | Mahasiswa | `20243` | `dev-mhs-3` |

### Pembagian Kelas

| Dosen | Kelas | Mata Kuliah |
|---|---|---|
| `dosen1` | Kelas 1 | Keamanan Informasi |
| `dosen2` | Kelas 2 | Basis Data |

### ID Nilai

| Kelas | Rentang ID | Mahasiswa |
|---|---|---|
| Kelas 1 | 1–3 | mhs1, mhs2, mhs3 |
| Kelas 2 | 4–6 | Sesuai data seed |

Gunakan akun tersebut hanya untuk pengujian pada lingkungan yang sesuai.

---

## 🔑 7. AUTENTIKASI DAN TOKEN

Sistem menggunakan beberapa mekanisme token dengan fungsi berbeda.

### 7.1. Access Token

Access token digunakan untuk mengakses endpoint yang membutuhkan autentikasi pengguna.

Masa berlaku berdasarkan dokumentasi kode adalah **10 menit**.

### 7.2. Refresh Token

Refresh token digunakan untuk meminta access token baru melalui endpoint refresh.

Refresh token disimpan dalam database sesuai implementasi dan dapat dicabut melalui proses logout.

### 7.3. Token Service

Token service digunakan untuk autentikasi komunikasi antarlayanan.

Masa berlaku berdasarkan dokumentasi kode adalah **5 menit**.

Token service tidak sama dengan token pengguna. Endpoint sinkronisasi yang khusus menerima token service dapat menolak token mahasiswa atau dosen.

### 7.4. Header Autentikasi

Endpoint yang memerlukan autentikasi pengguna menggunakan header seperti berikut:

```http
Authorization: Bearer <access_token>
X-Device-ID: <device_id>
```

Pastikan token dan identitas perangkat sesuai dengan akun serta kebijakan akses yang digunakan.

### 7.5. Perbedaan Secret

| Secret | Fungsi |
|---|---|
| `JWT_SECRET` | Digunakan untuk penandatanganan atau verifikasi token JWT sesuai implementasi |
| `GATEWAY_SECRET` | Mengamankan komunikasi gateway dengan service internal |
| Kredensial service | Memverifikasi identitas service saat meminta token service, jika mekanisme tersebut digunakan |

Ketiga nilai tersebut tidak boleh dipertukarkan secara sembarangan.

---

## 🛡️ 8. PENERAPAN ZERO TRUST SECURITY

### 8.1. Authentication

Setiap pengguna harus melewati proses autentikasi sebelum mendapatkan access token.

### 8.2. Authorization

Sistem memeriksa hak akses berdasarkan role pengguna dan kebijakan yang berlaku.

### 8.3. Device Validation

Identitas perangkat diperiksa melalui header `X-Device-ID`.

### 8.4. Least Privilege

Pengguna hanya diberikan hak akses yang sesuai dengan kewenangannya.

Contohnya, mahasiswa tidak seharusnya dapat mengubah nilai, sedangkan dosen hanya dapat mengakses data sesuai kewenangan kelasnya.

### 8.5. Policy Enforcement Point

API Gateway berfungsi sebagai Policy Enforcement Point (PEP), yaitu komponen yang menerapkan keputusan kebijakan akses terhadap permintaan yang masuk.

### 8.6. Perlindungan Layanan Internal

Service Nilai dan Service Transkrip memiliki mekanisme pemeriksaan keamanan melalui `shared/serviceGuard.js`.

Permintaan langsung yang tidak memenuhi persyaratan autentikasi internal dapat ditolak.

### 8.7. Service-to-Service Authentication

Komunikasi antarlayanan menggunakan token service sesuai kebijakan yang diterapkan pada backend.

### 8.8. Audit Logging

Aktivitas akses dicatat melalui mekanisme audit log untuk membantu pemeriksaan keamanan dan analisis kejadian.

---

## 📡 9. ENDPOINT API

Semua request client diarahkan melalui API Gateway dengan base URL:

```text
http://localhost:3000
```

| Layanan | Port | Kegunaan |
|---|---:|---|
| API Gateway | 3000 | Autentikasi, kebijakan akses, routing, dan audit |
| Service Nilai | 3001 | Operasi nilai dan kelas |
| Service Transkrip | 3002 | Operasi transkrip dan sinkronisasi |

Endpoint `/nilai` dan `/kelas` diteruskan ke Service Nilai, sedangkan `/transkrip` diteruskan ke Service Transkrip sesuai routing gateway.

Daftar method, path, parameter, dan body lengkap mengikuti Tabel 3 pada soal praktikum serta koleksi Postman yang disediakan.

---

## 🧪 10. PENGUJIAN API MENGGUNAKAN POSTMAN

### 10.1. Mengimpor Koleksi

1. Buka Postman.
2. Klik **Import**.
3. Pilih file `postman/sistem-nilai.postman_collection.json`.
4. Pastikan koleksi berhasil diimpor.
5. Jalankan backend menggunakan `npm start`.

### 10.2. Daftar Pengujian

| Request | Skenario | Tujuan |
|---|---|---|
| r1–r5 | Login pengguna | Menguji autentikasi akun |
| r6 | Perangkat tidak sesuai | Menguji validasi perangkat |
| r7 | Password salah | Menguji penolakan kredensial salah |
| r8 | Refresh token | Menguji pembaruan access token |
| r9 | Service token | Mendapatkan token untuk komunikasi antarlayanan |
| r10 | Secret service salah | Menguji penolakan kredensial service yang salah |
| r11–r20 | Akses dan perubahan nilai | Menguji kebijakan akses nilai |
| r21–r23 | Finalisasi nilai | Menguji aturan finalisasi nilai |
| r24–r28 | Akses transkrip | Menguji hak akses terhadap transkrip |
| r29 | Sinkronisasi transkrip | Menguji token service |
| r30 | Service mengakses endpoint nilai | Menguji pembatasan akses service |
| r31–r33 | Akses langsung service internal | Menguji perlindungan service internal |
| r34–r35 | Logout dan refresh token | Menguji pencabutan refresh token |

### 10.3. Urutan Pengujian

1. Jalankan aplikasi dan pastikan seluruh service aktif.
2. Jalankan request login untuk mendapatkan token pengguna.
3. Jalankan pengujian autentikasi dan akses nilai.
4. Pastikan konfigurasi kredensial service sudah sesuai.
5. Jalankan r9 untuk mendapatkan token service.
6. Gunakan token service tersebut untuk menjalankan r29.
7. Lanjutkan pengujian finalisasi, akses transkrip, dan perlindungan service internal.
8. Jalankan pengujian logout dan refresh token.
9. Catat hasil dan status HTTP setiap request.

**Catatan:** request yang bergantung pada token harus dijalankan setelah request penerbit token berhasil.

### 10.4. Pengujian Jam Akses

Untuk menguji kebijakan waktu:

1. Ubah `ACCESS_START` dan `ACCESS_END` pada `.env`.
2. Simpan file.
3. Restart aplikasi menggunakan `npm start`.
4. Jalankan request yang terpengaruh oleh kebijakan waktu.
5. Catat hasil pengujian.

---

## 📝 11. AUDIT LOG

Audit log digunakan untuk mencatat aktivitas akses yang terjadi pada sistem.

Audit log dapat diperiksa melalui:

- Output terminal API Gateway.
- Tabel `audit_log` dalam database SQLite.

Pencatatan ini membantu proses evaluasi ketika permintaan diizinkan atau ditolak oleh kebijakan keamanan.

Detail informasi yang dicatat mengikuti implementasi `gateway/audit.js` dan struktur tabel database.

---

## 🔧 12. TROUBLESHOOTING

### 12.1. Username atau Password Salah

Contoh respons:

```json
{
  "error": "Username atau password salah"
}
```

**Kemungkinan penyebab:**

- Username tidak terdaftar.
- Password tidak cocok.
- Data seed belum dibuat.
- Body login tidak sesuai dengan format backend.

**Solusi:**

1. Periksa username dan password akun pengujian.
2. Jalankan `npm run seed` jika data awal belum tersedia.
3. Periksa body request login di Postman.
4. Periksa implementasi autentikasi pada `gateway/auth.js`.

### 12.2. Access Token Wajib

Contoh respons:

```json
{
  "error": "Access token wajib (Authorization: Bearer <token>)"
}
```

**Penyebab:** endpoint yang diakses memerlukan access token, tetapi token belum dikirim atau tidak terbaca.

**Solusi:**

1. Jalankan request login.
2. Salin access token dari respons.
3. Buka request yang gagal.
4. Pilih **Authorization → Bearer Token**.
5. Tempel access token.
6. Kirim ulang request.

### 12.3. Endpoint Sinkronisasi Menolak Token Pengguna

Contoh respons:

```json
{
  "error": "endpoint sinkron hanya untuk token service, token user ditolak"
}
```

**Penyebab:** endpoint sinkronisasi mengharuskan token service, tetapi request menggunakan token pengguna atau token yang tidak sesuai.

**Solusi:**

1. Pastikan endpoint yang digunakan benar.
2. Periksa request r9 untuk meminta token service.
3. Cocokkan kredensial service dengan konfigurasi backend.
4. Jalankan r9 dan pastikan respons menghasilkan token service.
5. Gunakan token tersebut pada r29 sesuai mekanisme autentikasi yang diterapkan.
6. Jika masih gagal, periksa `gateway/tokens.js`, `gateway/auth.js`, dan `service-nilai/sync.js`.

Jangan menggunakan JWT Secret atau Gateway Secret sebagai token. Secret adalah nilai konfigurasi, sedangkan token adalah kredensial yang dihasilkan atau digunakan selama proses autentikasi.

### 12.4. Token Tidak Valid atau Kedaluwarsa

Periksa:

- Token yang digunakan benar.
- Token belum kedaluwarsa.
- Header menggunakan format Bearer.
- Token sesuai dengan jenis endpoint.
- Refresh token belum dicabut melalui logout.

### 12.5. Perangkat Ditolak

Periksa header `X-Device-ID` dan pastikan sesuai dengan perangkat yang terdaftar pada akun.

Contoh: `mhs1` menggunakan `dev-mhs-1` berdasarkan data seed.

### 12.6. Service Tidak Dapat Diakses

Jika request tidak dapat terhubung ke server:

1. Periksa terminal setelah menjalankan `npm start`.
2. Pastikan seluruh service berhasil berjalan.
3. Periksa port yang digunakan.
4. Pastikan tidak ada konflik port.
5. Periksa log error untuk mengetahui penyebab kegagalan.

---

## 🔒 13. KEAMANAN KONFIGURASI

Beberapa praktik keamanan yang perlu diterapkan:

- Jangan mengunggah file `.env` yang berisi secret ke repository publik.
- Simpan `.env.example` tanpa kredensial asli.
- Gunakan secret yang kuat dan berbeda sesuai fungsi.
- Jangan membagikan access token, refresh token, atau token service.
- Jangan menyimpan password pengguna dalam bentuk teks biasa.
- Terapkan pemeriksaan autentikasi dan otorisasi pada endpoint yang dilindungi.
- Lindungi layanan internal dari akses yang tidak sah.
- Hindari mencatat password dan secret dalam log.
- Gunakan HTTPS dan konfigurasi keamanan yang sesuai untuk lingkungan produksi.

---

## 📚 14. REFERENSI

**NIST Special Publication 800-207 — Zero Trust Architecture**

Referensi ini membahas konsep arsitektur Zero Trust, termasuk prinsip verifikasi akses, pengambilan keputusan berdasarkan kebijakan, dan perlindungan sumber daya.

---

## ✅ 15. KESIMPULAN

Sistem Nilai — Zero Trust Security merupakan aplikasi backend yang dirancang untuk menerapkan prinsip Zero Trust pada pengelolaan nilai dan transkrip mahasiswa.

API Gateway bertindak sebagai pintu masuk utama sekaligus Policy Enforcement Point yang menerapkan kebijakan akses. Sistem juga memanfaatkan autentikasi berbasis token, validasi perangkat, pembatasan hak akses, autentikasi antarlayanan, dan audit log untuk mendukung keamanan sistem.

Pengujian menggunakan Postman digunakan untuk memeriksa apakah permintaan yang sesuai dengan kebijakan dapat diproses dan apakah permintaan yang tidak sah ditolak.

Keberhasilan implementasi dievaluasi berdasarkan hasil pengujian aktual dan kesesuaian perilaku sistem dengan kebijakan keamanan yang telah ditentukan.