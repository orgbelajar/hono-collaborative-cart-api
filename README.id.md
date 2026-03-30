<div align="center">

# Hono Collaborative Cart API

[English](README.md) | [Bahasa Indonesia](README.id.md)

### REST API E-Commerce Berkinerja Tinggi dengan Keranjang Belanja Kolaboratif Real-Time

[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=000)](https://bun.sh)
[![Hono](https://img.shields.io/badge/framework-Hono-E36002?logo=hono&logoColor=fff)](https://hono.dev)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=fff)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql&logoColor=fff)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/cache-Redis-DC382D?logo=redis&logoColor=fff)](https://redis.io)
[![NATS](https://img.shields.io/badge/messaging-NATS_JetStream-27AAE1?logo=nats.io&logoColor=fff)](https://nats.io)
[![Docker](https://img.shields.io/badge/container-Docker-2496ED?logo=docker&logoColor=fff)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

<br />

**Bangun pengalaman belanja kolaboratif** — bagikan keranjang belanja dengan teman atau keluarga, lacak setiap aktivitas secara real-time, dan ekspor laporan pesanan melalui messaging asinkron.

[Mulai Cepat](#mulai-cepat) · [Referensi API](#referensi-api) · [Arsitektur](#arsitektur) · [Kontribusi](#kontribusi)

</div>

---

## Mengapa Hono Collaborative Cart API?

Kebanyakan API e-commerce memperlakukan keranjang belanja sebagai konstruk terisolasi untuk pengguna tunggal. Padahal, belanja pada dasarnya adalah aktivitas sosial — keluarga merencanakan belanja bersama, teman sekamar membagi pembelian kebutuhan rumah, dan tim mengoordinasikan perlengkapan kantor.

**Proyek ini menyelesaikan masalah tersebut** dengan memperkenalkan *keranjang belanja kolaboratif* sebagai fitur utama, memungkinkan banyak pengguna untuk menambah, menghapus, dan mengelola item dalam keranjang bersama dengan pelacakan aktivitas lengkap.

### Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Keranjang Kolaboratif** | Bagikan keranjang dengan pengguna lain, kelola kolaborator, dan lacak setiap aktivitas keranjang |
| **Autentikasi JWT** | Alur access & refresh token yang aman dengan otorisasi Bearer token |
| **Manajemen Produk** | CRUD lengkap dengan unggah gambar, wishlist, kategorisasi, dan filter berbasis slug |
| **Query Terpaginasi** | Pencarian produk lanjutan dengan filter rentang harga, stok, kategori, dan pengurutan kustom |
| **Ekspor Asinkron via NATS** | Ekspor laporan pesanan secara asinkron melalui message broker NATS JetStream |
| **Caching Redis** | Lapisan caching sisi server dengan TTL yang dapat dikonfigurasi untuk endpoint baca tinggi |
| **Rate Limiting & Throttling** | Rate limiting bertingkat per endpoint + throttle progresif pada rute publik |
| **Siap Docker** | Stack `docker-compose` lengkap dengan PostgreSQL, Redis, NATS, dan Adminer |
| **Pipeline CI/CD** | Pengujian, linting, dan build/push Docker image otomatis via GitHub Actions |
| **Tes Komprehensif** | Tes integrasi end-to-end untuk semua domain layanan |

---

## Arsitektur

```
+----------------------------------------------------------+
|                      Permintaan Client                   |
+-------------------------+--------------------------------+
                          |
                          v
+----------------------------------------------------------+
|                  Hono HTTP Server (Bun)                   |
|  +--------------+ +---------------+ +------------------+  |
|  |    CORS      | | Rate Limiter  | |    Throttle      |  |
|  +--------------+ +---------------+ +------------------+  |
|  +------------------------------------------------------+ |
|  |              Auth Middleware (JWT)                    | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |                    Controller                        | |
|  |  Auth - User - Product - Category - Cart - Collab    | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |        Validator (Zod) -> Repository (Prisma)        | |
|  +------------------------------------------------------+ |
+-------+----------------+----------------+----------------+
        |                |                |
        v                v                v
  +-----------+    +-----------+    +-------------+
  | PostgreSQL|    |   Redis   |    |    NATS     |
  | (Utama)   |    |  (Cache)  |    | (JetStream) |
  +-----------+    +-----------+    +-------------+
```

---

## Mulai Cepat

### Prasyarat

- [Bun](https://bun.sh) v1.0+ — Runtime JavaScript & package manager
- [Docker](https://www.docker.com) & Docker Compose — untuk layanan infrastruktur
- [PostgreSQL](https://www.postgresql.org) 16+ *(atau gunakan Docker)*

### Opsi 1: Jalankan dengan Docker Compose (Direkomendasikan)

Jalankan seluruh stack dengan satu perintah:

```bash
# Clone repositori
git clone https://github.com/nabil/hono-collaborative-cart-api.git
cd hono-collaborative-cart-api

# Konfigurasi environment
cp .env.container .env

# Jalankan semua layanan (app + PostgreSQL + Redis + NATS + Adminer)
docker compose up -d

# Jalankan migrasi database
docker compose exec app bunx prisma migrate deploy
```

API tersedia di `http://localhost:3000` dan Adminer (GUI Database) di `http://localhost:8080`.

### Opsi 2: Pengembangan Lokal

```bash
# Clone repositori
git clone https://github.com/nabil/hono-collaborative-cart-api.git
cd hono-collaborative-cart-api

# Install dependensi
bun install

# Siapkan variabel environment
cp .env.example .env
# Edit .env dengan kredensial database, host Redis, URL NATS, dan kunci JWT Anda

# Generate Prisma Client
bunx prisma generate

# Jalankan migrasi database
bunx prisma migrate deploy

# Jalankan server pengembangan dengan hot-reload
bun run start:dev
```

API sekarang berjalan di `http://localhost:3000`.

---

## Referensi API

Semua endpoint mengembalikan respons JSON dengan struktur standar:

```json
{
  "status": "success",
  "message": "...",
  "data": { }
}
```

### Autentikasi

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/authentication` | Login — mengembalikan access & refresh token | Tidak | 5 req / 15 menit |
| `PUT` | `/api/authentication` | Perbarui access token | Tidak | — |
| `DELETE` | `/api/authentication` | Logout — cabut refresh token | Tidak | — |

<details>
<summary><b>Contoh: Login</b></summary>

```bash
curl -X POST http://localhost:3000/api/authentication \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "securepassword"}'
```

**Respons:**
```json
{
  "status": "success",
  "message": "Authentication berhasil ditambahkan",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
</details>

### Pengguna

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/user` | Registrasi pengguna baru | Tidak | 3 req / 60 menit |
| `GET` | `/api/user/:id` | Ambil pengguna berdasarkan ID | Tidak | Throttled |
| `GET` | `/api/users?username=` | Cari pengguna berdasarkan username | Tidak | Throttled |

### Produk

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/product` | Buat produk | Tidak | — |
| `GET` | `/api/products` | Daftar produk (terpaginasi, dapat difilter) | Tidak | Throttled |
| `GET` | `/api/product/:id` | Detail produk | Tidak | Throttled |
| `PATCH` | `/api/product/:id` | Perbarui produk | Tidak | — |
| `PATCH` | `/api/product/:id/stock` | Restok produk | Tidak | — |
| `DELETE` | `/api/product/:id` | Hapus produk | Tidak | — |
| `POST` | `/api/product/:id/image` | Unggah gambar produk | Tidak | 10 req / 15 menit |
| `POST` | `/api/product/:id/wishlist` | Tambah ke wishlist | Ya | — |
| `DELETE` | `/api/product/:id/wishlist` | Hapus dari wishlist | Ya | — |
| `GET` | `/api/product/:id/wishlists` | Ambil jumlah wishlist | Ya | — |

<details>
<summary><b>Parameter Query Pencarian Produk</b></summary>

| Parameter | Tipe | Default | Deskripsi |
|---|---|---|---|
| `page` | `number` | `1` | Nomor halaman |
| `size` | `number` | `10` | Item per halaman |
| `name` | `string` | — | Filter berdasarkan nama produk (pencocokan parsial) |
| `min_price` | `number` | — | Filter harga minimum |
| `max_price` | `number` | — | Filter harga maksimum |
| `in_stock` | `boolean` | — | Hanya tampilkan produk yang tersedia |
| `category_slug` | `string` | — | Filter berdasarkan slug kategori |
| `sort_by` | `string` | — | Kolom pengurutan (`price`, `name`, `createdAt`) |
| `sort_order` | `string` | — | Arah pengurutan (`asc`, `desc`) |

```bash
curl "http://localhost:3000/api/products?page=1&size=5&min_price=10000&in_stock=true&sort_by=price&sort_order=asc"
```
</details>

### Kategori

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/category` | Buat kategori | Tidak |
| `GET` | `/api/categories` | Daftar semua kategori | Tidak |
| `GET` | `/api/category/:id/products` | Ambil kategori beserta produknya | Tidak |
| `PATCH` | `/api/category/:id` | Perbarui kategori | Tidak |
| `DELETE` | `/api/category/:id` | Hapus kategori | Tidak |

### Keranjang Belanja (Memerlukan Autentikasi)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/cart` | Buat keranjang baru |
| `GET` | `/api/carts` | Daftar keranjang pengguna (milik sendiri + dibagikan) |
| `DELETE` | `/api/cart/:id` | Hapus keranjang (hanya pemilik) |
| `POST` | `/api/cart/:id/product` | Tambah produk ke keranjang |
| `GET` | `/api/cart/:id/products` | Lihat item keranjang |
| `DELETE` | `/api/cart/:id/products` | Hapus produk dari keranjang |
| `GET` | `/api/cart/:id/activities` | Lihat log aktivitas keranjang |

### Kolaborasi (Memerlukan Autentikasi)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/collaborations` | Tambah kolaborator ke keranjang (hanya pemilik) |
| `DELETE` | `/api/collaborations` | Hapus kolaborator dari keranjang (hanya pemilik) |

### Ekspor (Memerlukan Autentikasi)

| Method | Endpoint | Deskripsi | Rate Limit |
|---|---|---|---|
| `POST` | `/api/export/order/:cartId` | Ekspor laporan pesanan via email (asinkron) | 10 req / 15 menit |

> Permintaan ekspor dipublikasikan ke **NATS JetStream** dan diproses secara asinkron. Laporan akan dikirim ke alamat email yang ditentukan.

---

## Keamanan & Rate Limiting

API ini menerapkan **pertahanan dua lapis** terhadap penyalahgunaan:

### Rate Limiting (`hono-rate-limiter`)

Kuota permintaan ketat per IP/pengguna dengan header respons standar `RateLimit-*`:

| Tipe Endpoint | Batas | Jendela Waktu | Kunci |
|---|---|---|---|
| Login | 5 permintaan | 15 menit | IP Client |
| Registrasi | 3 permintaan | 60 menit | IP Client |
| Operasi Berat (unggah, ekspor) | 10 permintaan | 15 menit | Token Auth / IP |

### Throttling Progresif (Middleware Kustom)

Diterapkan pada endpoint GET publik, secara bertahap memperlambat permintaan alih-alih memblokirnya:

| Penggunaan | Delay | Perilaku |
|---|---|---|
| 0-60% | 0 ms | Kecepatan normal |
| 60-80% | 500-1500 ms | Perlambatan ringan |
| 80-100% | 1500-3000 ms | Delay signifikan |
| >100% | 3000 ms | Delay maksimal (tetap diproses) |

Header respons `X-Throttle-Delay-Ms` menunjukkan delay yang diterapkan.

---

## Tech Stack

| Lapisan | Teknologi | Tujuan |
|---|---|---|
| **Runtime** | [Bun](https://bun.sh) | Runtime JavaScript/TypeScript ultra-cepat |
| **Framework** | [Hono](https://hono.dev) | Web framework ultrafast untuk edge |
| **Database** | [PostgreSQL](https://www.postgresql.org) | Penyimpanan data relasional utama |
| **ORM** | [Prisma](https://www.prisma.io) | Database client type-safe dengan migrasi |
| **Cache** | [Redis](https://redis.io) | Caching in-memory untuk wishlist & data panas |
| **Message Broker** | [NATS JetStream](https://nats.io) | Messaging asinkron tahan lama untuk pekerjaan ekspor |
| **Validasi** | [Zod](https://zod.dev) | Validasi skema saat runtime |
| **Auth** | [Hono JWT](https://hono.dev) | Manajemen access & refresh token HS256 |
| **Logging** | [Winston](https://github.com/winstonjs/winston) | Logging aplikasi terstruktur |
| **Email** | [Resend](https://resend.com) | Pengiriman email transaksional untuk ekspor |
| **Linter** | [Biome](https://biomejs.dev) | Formatter & linter cepat |
| **Container** | [Docker](https://www.docker.com) | Build multi-stage dengan base image Bun |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Otomasi tes, lint, build & push |

---

## Struktur Proyek

```
hono-collaborative-cart-api/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline CI/CD
├── prisma/
│   ├── schema.prisma              # Skema database
│   └── migrations/                # Riwayat migrasi
├── src/
│   ├── server.ts                  # Entry point & graceful shutdown
│   ├── server/
│   │   └── index.ts               # Setup aplikasi Hono & mounting rute
│   ├── applications/
│   │   ├── database.ts            # Inisialisasi Prisma client
│   │   ├── logging.ts             # Konfigurasi logger Winston
│   │   └── nats.ts                # Koneksi NATS JetStream
│   ├── cache/
│   │   └── redis-server.ts        # Layanan cache Redis
│   ├── exceptions/                # Kelas error kustom
│   │   ├── authentication-error.ts
│   │   ├── authorization-error.ts
│   │   ├── client-error.ts
│   │   ├── invariant-error.ts
│   │   └── not-found-error.ts
│   ├── middlewares/
│   │   ├── auth.ts                # Verifikasi JWT Bearer token
│   │   ├── error.ts               # Penanganan error global
│   │   ├── rate-limiter.ts        # Rate limiting per endpoint
│   │   └── throttle.ts            # Throttle permintaan progresif
│   ├── model/                     # Definisi tipe TypeScript
│   ├── security/
│   │   └── token-manager.ts       # Pembuatan & verifikasi token JWT
│   ├── services/
│   │   ├── authentications/       # Login, refresh, logout
│   │   ├── users/                 # Registrasi, query pengguna
│   │   ├── products/              # CRUD, unggah gambar, wishlist
│   │   ├── categories/            # CRUD dengan dukungan slug
│   │   ├── carts/                 # Manajemen keranjang & log aktivitas
│   │   ├── collaborations/        # Manajemen pengguna keranjang bersama
│   │   └── exports/               # Ekspor pesanan asinkron via NATS
│   └── utils/
│       └── config.ts              # Konfigurasi environment terpusat
├── tests/                         # Suite tes integrasi
│   ├── authentication.test.ts
│   ├── user.test.ts
│   ├── product.test.ts
│   ├── category.test.ts
│   ├── cart.test.ts
│   ├── collaboration.test.ts
│   ├── export.test.ts
│   └── rate-limit-throttle.test.ts
├── docker-compose.yml             # Orkestrasi stack lengkap
├── Dockerfile                     # Build produksi multi-stage
├── biome.json                     # Konfigurasi linter & formatter
├── tsconfig.json                  # Konfigurasi TypeScript
└── package.json
```

Setiap layanan mengikuti pola **Controller -> Validator -> Repository** untuk pemisahan kepentingan yang bersih.

---

## Variabel Environment

Buat file `.env` di root proyek:

```env
# Server
HOST=localhost
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hono_ecommerce

# Redis
REDIS_SERVER=localhost

# NATS
NATS_URL=nats://localhost:4222

# Kunci JWT
ACCESS_TOKEN_KEY=kunci_rahasia_access_token_anda
REFRESH_TOKEN_KEY=kunci_rahasia_refresh_token_anda
```

---

## Menjalankan Tes

Proyek ini mencakup tes integrasi komprehensif yang mencakup semua domain layanan:

```bash
# Jalankan layanan infrastruktur
docker compose up postgres redis -d

# Jalankan NATS dengan JetStream
docker run -d --name nats -p 4222:4222 -p 8222:8222 nats:2.10-alpine -js

# Jalankan semua tes
bun test

# Jalankan suite tes tertentu
bun test tests/cart.test.ts
bun test tests/collaboration.test.ts
```

> Tes secara otomatis melewati rate limiting dan throttling melalui `NODE_ENV=test` untuk memastikan eksekusi tes yang terisolasi dan andal.

---

## Docker

### Build Multi-Stage

Dockerfile menggunakan build multi-stage untuk image produksi yang optimal:

```bash
# Build image
docker build -t hono-collaborative-cart-api .

# Jalankan dengan Docker Compose (termasuk semua dependensi)
docker compose up -d
```

### Layanan yang Disertakan

| Layanan | Port | Tujuan |
|---|---|---|
| **App** | `3000` | Server API Hono |
| **PostgreSQL** | `5432` | Database utama |
| **Redis** | `6379` | Lapisan cache |
| **NATS** | `4222` / `8222` | Message broker + monitoring |
| **Adminer** | `8080` | GUI manajemen database |

---

## Pipeline CI/CD

Workflow GitHub Actions (`ci.yml`) mengotomasi siklus pengembangan lengkap:

```mermaid
graph LR
    A[Push / PR] --> B[Checkout]
    B --> C[Setup Bun]
    C --> D[Install Dependensi]
    D --> E[Cek Lint]
    E --> F[Prisma Generate & Migrate]
    F --> G[Jalankan NATS JetStream]
    G --> H[Jalankan Tes]
    H --> I[Build Docker Image]
    I --> J[Push ke GHCR]
```

- **Pemicu**: Push ke `main`/`master` atau Pull Request
- **Job Tes**: Layanan PostgreSQL + Redis, NATS JetStream, migrasi Prisma, tes Bun
- **Job Build**: Build Docker multi-arch lalu push ke GitHub Container Registry (`ghcr.io`)

---

## Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---

<div align="center">

Dibangun dengan [Hono](https://hono.dev) + [Bun](https://bun.sh) + [Prisma](https://prisma.io)

</div>
