<div align="center">

# Hono Collaborative Cart API

[English](README.md) | [Bahasa Indonesia](README.id.md)

### A High-Performance E-Commerce REST API with Real-Time Collaborative Shopping Carts

[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=000)](https://bun.sh)
[![Hono](https://img.shields.io/badge/framework-Hono-E36002?logo=hono&logoColor=fff)](https://hono.dev)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=fff)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql&logoColor=fff)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/cache-Redis-DC382D?logo=redis&logoColor=fff)](https://redis.io)
[![NATS](https://img.shields.io/badge/messaging-NATS_JetStream-27AAE1?logo=nats.io&logoColor=fff)](https://nats.io)
[![Docker](https://img.shields.io/badge/container-Docker-2496ED?logo=docker&logoColor=fff)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

<br />

**Build collaborative shopping experiences** — share carts with friends or family, track every activity in real-time, and export order reports via asynchronous messaging.

[Quick Start](#quick-start) · [API Reference](#api-reference) · [Architecture](#architecture) · [Contributing](#contributing)

</div>

---

## Why Hono Collaborative Cart API?

Most e-commerce APIs treat shopping carts as isolated, single-user constructs. But shopping is inherently social — families plan groceries together, roommates split household purchases, and teams coordinate office supplies.

**This project solves that problem** by introducing *collaborative shopping carts* as a first-class feature, allowing multiple users to add, remove, and manage items in a shared cart with full activity tracking.

### Key Features

| Feature | Description |
|---|---|
| **Collaborative Carts** | Share carts with other users, manage collaborators, and track every cart activity |
| **JWT Authentication** | Secure access & refresh token flow with Bearer token authorization |
| **Product Management** | Full CRUD with image upload, wishlists, categorization, and slug-based filtering |
| **Paginated Queries** | Advanced product search with filtering by price range, stock, category, and custom sorting |
| **Async Export via NATS** | Export order reports asynchronously through NATS JetStream message broker |
| **Redis Caching** | Server-side caching layer with configurable TTL for high-read endpoints |
| **Rate Limiting & Throttling** | Tiered rate limiting per endpoint + progressive throttle on public routes |
| **Docker Ready** | Full `docker-compose` stack with PostgreSQL, Redis, NATS, and Adminer |
| **CI/CD Pipeline** | Automated testing, linting, and Docker image build/push via GitHub Actions |
| **Comprehensive Tests** | End-to-end integration tests for all service domains |

---

## Architecture

```
+----------------------------------------------------------+
|                      Client Request                      |
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
|  |                   Controllers                        | |
|  |  Auth - User - Product - Category - Cart - Collab    | |
|  +------------------------------------------------------+ |
|  +------------------------------------------------------+ |
|  |        Validator (Zod) -> Repositories (Prisma)      | |
|  +------------------------------------------------------+ |
+-------+----------------+----------------+----------------+
        |                |                |
        v                v                v
  +-----------+    +-----------+    +-------------+
  | PostgreSQL|    |   Redis   |    |    NATS     |
  | (Primary) |    |  (Cache)  |    | (JetStream) |
  +-----------+    +-----------+    +-------------+
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0+ — JavaScript runtime & package manager
- [Docker](https://www.docker.com) & Docker Compose — for infrastructure services
- [PostgreSQL](https://www.postgresql.org) 16+ *(or use Docker)*

### Option 1: Run with Docker Compose (Recommended)

Spin up the entire stack with a single command:

```bash
# Clone the repository
git clone https://github.com/nabil/hono-collaborative-cart-api.git
cd hono-collaborative-cart-api

# Configure environment
cp .env.container .env

# Start all services (app + PostgreSQL + Redis + NATS + Adminer)
docker compose up -d

# Run database migrations
docker compose exec app bunx prisma migrate deploy
```

The API will be available at `http://localhost:3000` and Adminer (DB GUI) at `http://localhost:8080`.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/nabil/hono-collaborative-cart-api.git
cd hono-collaborative-cart-api

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials, Redis host, NATS URL, and JWT keys

# Generate Prisma Client
bunx prisma generate

# Run database migrations
bunx prisma migrate deploy

# Start development server with hot-reload
bun run start:dev
```

The API is now running at `http://localhost:3000`.

---

## API Reference

All endpoints return JSON responses with a standard structure:

```json
{
  "status": "success",
  "message": "...",
  "data": { }
}
```

### Authentication

| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/authentication` | Login — returns access & refresh tokens | No | 5 req / 15 min |
| `PUT` | `/api/authentication` | Refresh access token | No | — |
| `DELETE` | `/api/authentication` | Logout — revoke refresh token | No | — |

<details>
<summary><b>Example: Login</b></summary>

```bash
curl -X POST http://localhost:3000/api/authentication \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "securepassword"}'
```

**Response:**
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

### Users

| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/user` | Register new user | No | 3 req / 60 min |
| `GET` | `/api/user/:id` | Get user by ID | No | Throttled |
| `GET` | `/api/users?username=` | Search users by username | No | Throttled |

### Products

| Method | Endpoint | Description | Auth | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/product` | Create product | No | — |
| `GET` | `/api/products` | List products (paginated, filterable) | No | Throttled |
| `GET` | `/api/product/:id` | Get product detail | No | Throttled |
| `PATCH` | `/api/product/:id` | Update product | No | — |
| `PATCH` | `/api/product/:id/stock` | Restock product | No | — |
| `DELETE` | `/api/product/:id` | Delete product | No | — |
| `POST` | `/api/product/:id/image` | Upload product image | No | 10 req / 15 min |
| `POST` | `/api/product/:id/wishlist` | Add to wishlist | Yes | — |
| `DELETE` | `/api/product/:id/wishlist` | Remove from wishlist | Yes | — |
| `GET` | `/api/product/:id/wishlists` | Get wishlist count | Yes | — |

<details>
<summary><b>Product Search Query Parameters</b></summary>

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `size` | `number` | `10` | Items per page |
| `name` | `string` | — | Filter by product name (partial match) |
| `min_price` | `number` | — | Minimum price filter |
| `max_price` | `number` | — | Maximum price filter |
| `in_stock` | `boolean` | — | Only show in-stock products |
| `category_slug` | `string` | — | Filter by category slug |
| `sort_by` | `string` | — | Sort field (`price`, `name`, `createdAt`) |
| `sort_order` | `string` | — | Sort direction (`asc`, `desc`) |

```bash
curl "http://localhost:3000/api/products?page=1&size=5&min_price=10000&in_stock=true&sort_by=price&sort_order=asc"
```
</details>

### Categories

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/category` | Create category | No |
| `GET` | `/api/categories` | List all categories | No |
| `GET` | `/api/category/:id/products` | Get category with its products | No |
| `PATCH` | `/api/category/:id` | Update category | No |
| `DELETE` | `/api/category/:id` | Delete category | No |

### Carts (Requires Authentication)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cart` | Create a new cart |
| `GET` | `/api/carts` | List user's carts (owned + shared) |
| `DELETE` | `/api/cart/:id` | Delete cart (owner only) |
| `POST` | `/api/cart/:id/product` | Add product to cart |
| `GET` | `/api/cart/:id/products` | View cart items |
| `DELETE` | `/api/cart/:id/products` | Remove product from cart |
| `GET` | `/api/cart/:id/activities` | View cart activity log |

### Collaborations (Requires Authentication)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/collaborations` | Add collaborator to cart (owner only) |
| `DELETE` | `/api/collaborations` | Remove collaborator from cart (owner only) |

### Export (Requires Authentication)

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/export/order/:cartId` | Export order report via email (async) | 10 req / 15 min |

> Export requests are published to **NATS JetStream** and processed asynchronously. The report is sent to the specified email address.

---

## Security & Rate Limiting

The API implements a **two-layer defense** against abuse:

### Rate Limiting (`hono-rate-limiter`)

Strict request quotas per IP/user with standard `RateLimit-*` response headers:

| Endpoint Type | Limit | Window | Key |
|---|---|---|---|
| Login | 5 requests | 15 minutes | Client IP |
| Registration | 3 requests | 60 minutes | Client IP |
| Heavy Operations (upload, export) | 10 requests | 15 minutes | Auth token / IP |

### Progressive Throttling (Custom Middleware)

Applied to public GET endpoints, it gradually slows down requests instead of blocking them:

| Usage | Delay | Behavior |
|---|---|---|
| 0-60% | 0 ms | Normal speed |
| 60-80% | 500-1500 ms | Slight slowdown |
| 80-100% | 1500-3000 ms | Significant delay |
| >100% | 3000 ms | Maximum delay (still processed) |

The `X-Throttle-Delay-Ms` response header indicates the applied delay.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | [Bun](https://bun.sh) | Ultra-fast JavaScript/TypeScript runtime |
| **Framework** | [Hono](https://hono.dev) | Ultrafast web framework for the edge |
| **Database** | [PostgreSQL](https://www.postgresql.org) | Primary relational data store |
| **ORM** | [Prisma](https://www.prisma.io) | Type-safe database client with migrations |
| **Cache** | [Redis](https://redis.io) | In-memory caching for wishlists & hot data |
| **Message Broker** | [NATS JetStream](https://nats.io) | Durable async messaging for export jobs |
| **Validation** | [Zod](https://zod.dev) | Runtime schema validation |
| **Auth** | [Hono JWT](https://hono.dev) | HS256 access & refresh token management |
| **Logging** | [Winston](https://github.com/winstonjs/winston) | Structured application logging |
| **Email** | [Resend](https://resend.com) | Transactional email delivery for exports |
| **Linter** | [Biome](https://biomejs.dev) | Fast formatter & linter |
| **Container** | [Docker](https://www.docker.com) | Multi-stage build with Bun base image |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Automated test, lint, build & push |

---

## Project Structure

```
hono-collaborative-cart-api/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
├── src/
│   ├── server.ts                  # Entry point & graceful shutdown
│   ├── server/
│   │   └── index.ts               # Hono app setup & route mounting
│   ├── applications/
│   │   ├── database.ts            # Prisma client initialization
│   │   ├── logging.ts             # Winston logger config
│   │   └── nats.ts                # NATS JetStream connection
│   ├── cache/
│   │   └── redis-server.ts        # Redis cache service
│   ├── exceptions/                # Custom error classes
│   │   ├── authentication-error.ts
│   │   ├── authorization-error.ts
│   │   ├── client-error.ts
│   │   ├── invariant-error.ts
│   │   └── not-found-error.ts
│   ├── middlewares/
│   │   ├── auth.ts                # JWT Bearer token verification
│   │   ├── error.ts               # Global error handler
│   │   ├── rate-limiter.ts        # Per-endpoint rate limiting
│   │   └── throttle.ts            # Progressive request throttle
│   ├── model/                     # TypeScript type definitions
│   ├── security/
│   │   └── token-manager.ts       # JWT token generation & verification
│   ├── services/
│   │   ├── authentications/       # Login, refresh, logout
│   │   ├── users/                 # Registration, user queries
│   │   ├── products/              # CRUD, image upload, wishlist
│   │   ├── categories/            # CRUD with slug support
│   │   ├── carts/                 # Cart management & activity log
│   │   ├── collaborations/        # Shared cart user management
│   │   └── exports/               # Async order export via NATS
│   └── utils/
│       └── config.ts              # Centralized env config
├── tests/                         # Integration test suites
│   ├── authentication.test.ts
│   ├── user.test.ts
│   ├── product.test.ts
│   ├── category.test.ts
│   ├── cart.test.ts
│   ├── collaboration.test.ts
│   ├── export.test.ts
│   └── rate-limit-throttle.test.ts
├── docker-compose.yml             # Full stack orchestration
├── Dockerfile                     # Multi-stage production build
├── biome.json                     # Linter & formatter config
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

Each service follows the **Controller -> Validator -> Repository** pattern for clean separation of concerns.

---

## Environment Variables

Create a `.env` file in the project root:

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

# JWT Secrets
ACCESS_TOKEN_KEY=your_access_token_secret_key
REFRESH_TOKEN_KEY=your_refresh_token_secret_key
```

---

## Running Tests

The project includes comprehensive integration tests covering all service domains:

```bash
# Start infrastructure services
docker compose up postgres redis -d

# Start NATS with JetStream
docker run -d --name nats -p 4222:4222 -p 8222:8222 nats:2.10-alpine -js

# Run all tests
bun test

# Run specific test suite
bun test tests/cart.test.ts
bun test tests/collaboration.test.ts
```

> Tests automatically skip rate limiting and throttling via `NODE_ENV=test` to ensure isolated, reliable test execution.

---

## Docker

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimized production images:

```bash
# Build the image
docker build -t hono-collaborative-cart-api .

# Run with Docker Compose (includes all dependencies)
docker compose up -d
```

### Included Services

| Service | Port | Purpose |
|---|---|---|
| **App** | `3000` | Hono API server |
| **PostgreSQL** | `5432` | Primary database |
| **Redis** | `6379` | Cache layer |
| **NATS** | `4222` / `8222` | Message broker + monitoring |
| **Adminer** | `8080` | Database management GUI |

---

## CI/CD Pipeline

The GitHub Actions workflow (`ci.yml`) automates the full development lifecycle:

```mermaid
graph LR
    A[Push / PR] --> B[Checkout]
    B --> C[Setup Bun]
    C --> D[Install Deps]
    D --> E[Lint Check]
    E --> F[Prisma Generate & Migrate]
    F --> G[Start NATS JetStream]
    G --> H[Run Tests]
    H --> I[Build Docker Image]
    I --> J[Push to GHCR]
```

- **Trigger**: Push to `main`/`master` or Pull Request
- **Test Job**: PostgreSQL + Redis services, NATS JetStream, Prisma migrations, Bun tests
- **Build Job**: Multi-arch Docker build then push to GitHub Container Registry (`ghcr.io`)

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with [Hono](https://hono.dev) + [Bun](https://bun.sh) + [Prisma](https://prisma.io)

</div>
