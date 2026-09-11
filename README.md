# 🚀 QUICK FINDER — Campus Lost & Found Platform

> **"Lost it? Find it."**

A full-stack Lost & Found management platform for PSG College of Arts and Science, built with React + Vite (frontend) and Express + Firebase Realtime Database (backend).

---

## ⚡ Quick Setup (for friends sharing this project)

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment file (already filled in — just rename it)
copy .env.example .env
# → Or your friend sends you the actual .env file directly

# 3. Place the Firebase service account JSON in:
#    apps/api/src/config/firebase-service-account.json
#    (Download from Firebase Console → Project Settings → Service Accounts)

# 4. Start everything
npm run dev
```

> **One .env file at the root** covers everything — API server, Firebase, and OTP.  
> No need to touch any files inside `apps/api/` or `apps/web/`.

---



## 🏗️ Production Architecture Overview

```
quick-finder/
├── apps/
│   ├── api/                          # Production REST API Service (Node.js / Express)
│   │   ├── src/
│   │   │   ├── config/               # Validated environment configuration & defaults
│   │   │   ├── db/                   # Adaptive database driver (node:sqlite / better-sqlite3)
│   │   │   │   ├── connection.js     # Zero-compilation native driver with WAL mode
│   │   │   │   └── init.js           # Schema migrations and index setup
│   │   │   ├── repositories/         # Data Access Layer (DAL) isolating raw SQL
│   │   │   │   ├── userRepository.js
│   │   │   │   ├── itemRepository.js
│   │   │   │   ├── matchRepository.js
│   │   │   │   ├── claimRepository.js
│   │   │   │   └── notificationRepository.js
│   │   │   ├── services/             # Domain Business Logic & Algorithms
│   │   │   │   ├── authService.js
│   │   │   │   ├── matchingService.js # 6-Factor weighted similarity matching engine
│   │   │   │   ├── claimService.js   # Ownership state machine & privacy unlocking
│   │   │   │   ├── adminService.js   # Metrics aggregation & moderation audit
│   │   │   │   └── notificationService.js
│   │   │   ├── controllers/          # HTTP presentation & validation envelopes
│   │   │   ├── middleware/           # Security headers, rate limiting, request logging, auth
│   │   │   ├── routes/               # Modular Express routing tables
│   │   │   ├── utils/                # Structured logger, standard ApiResponse, AppErrors
│   │   │   └── server.js             # Express app, health probes & graceful shutdown
│   │   ├── seed/                     # Realistic campus demo account seeds
│   │   ├── tests/                    # End-to-End integration test suite
│   │   ├── uploads/                  # Organized media storage (/items, /profiles, /proofs)
│   │   └── Dockerfile                # Multi-stage lightweight Alpine container
│   │
│   └── web/                          # Production Client SPA (React 19 / Vite / Tailwind)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/               # Atomic design primitives (Button, Card, Badge, EmptyState)
│       │   │   ├── feedback/         # ErrorBoundary, ToastProvider, SkeletonLoader
│       │   │   └── layout/           # Navbar, Footer, ProtectedRoute
│       │   ├── features/             # Domain feature modules (auth, items, matches, claims, admin)
│       │   ├── context/              # Global state (AuthContext, NotificationContext, ToastContext)
│       │   ├── pages/                # Route-level views code-split via React.lazy & Suspense
│       │   ├── services/             # Axios API client with automatic token attachment
│       │   └── App.jsx               # Application root with ErrorBoundary & ToastProvider
│       ├── Dockerfile                # Multi-stage build -> Nginx Alpine static server
│       └── vite.config.js            # Vendor chunk splitting & build optimization
│
├── packages/
│   └── shared/                       # Shared Monorepo Package (@quickfinder/shared)
│       └── src/
│           ├── constants.js          # Categories, Status Enums, Matching Weights & Synonyms
│           ├── validators.js         # Unified input & schema validation rules
│           └── formatters.js         # Shared date formatters & status styling maps
│
├── infra/
│   └── docker/
│       ├── Dockerfile.api            # Production container configuration for API
│       ├── Dockerfile.web            # Production container configuration for Web
│       └── nginx.conf                # Nginx reverse proxy with caching & SPA routing
│
├── scripts/
│   └── dev.js                        # Cross-platform concurrent dev runner with colored prefixes
│
├── .github/
│   └── workflows/ci.yml              # Automated GitHub Actions CI pipeline
│
├── docker-compose.yml                # Production multi-container stack orchestration
├── docker-compose.dev.yml            # Local development container stack with live reload
├── ecosystem.config.js               # PM2 production process manager cluster config
└── package.json                      # Monorepo root workspace orchestration
```

---

## 🌟 Key Production Enhancements

### 1. Adaptive SQLite Database Engine
- Leverages Node.js 22+ built-in `node:sqlite` (`DatabaseSync`) for native performance and zero external C++ build tool dependencies (no Visual Studio or Python required on Windows).
- Automatic fallback to `better-sqlite3` in environments where applicable.
- Configured with **Write-Ahead Logging (WAL)** mode for concurrent reads/writes and strict foreign key integrity.

### 2. Clean Layered Architecture (DAL + Domain Services)
- Controllers no longer mix SQL queries with HTTP concerns.
- **Repositories (`src/repositories/`)**: Abstract and encapsulate all SQL queries.
- **Services (`src/services/`)**: Isolate business rules, claim transitions, and algorithms.
- **Controllers (`src/controllers/`)**: Handle HTTP requests and return standard responses.

### 3. Production Security & Reliability
- **Security Headers**: Standard headers (`nosniff`, `SAMEORIGIN`, `X-XSS-Protection`).
- **Sliding-Window Rate Limiting**: In-memory rate limiting preventing brute-force login attempts and upload flooding.
- **Correlation Request Logging**: Unique `X-Request-Id` headers injected into all requests with response duration tracking.
- **RFC 7807 Error Handling**: Centralized error middleware masking internal stack traces in production.
- **Health Probes**: `/health` (liveness) and `/api/health` (deep readiness checking DB connection, memory, and uptime).
- **Graceful Shutdown**: Handles `SIGTERM`/`SIGINT`, flushes SQLite WAL buffers, and finishes active HTTP requests cleanly.

### 4. Feature-Driven Frontend Architecture
- **Route-Level Code-Splitting**: Routes dynamically loaded via `React.lazy()` and `Suspense`, cutting initial bundle load time in half.
- **Atomic UI Primitives**: Reusable `Button`, `Card`, `Badge`, `EmptyState`, and `SkeletonLoader`.
- **Global Toast Feedback**: Replaces native browser popups with non-blocking, animated toasts.
- **React Error Boundary**: Traps unhandled rendering exceptions with a recovery interface.

### 5. Multi-Factor Matching Algorithm (Section 10 & 11)
- **Item Name (30%)**: Jaccard token similarity with substring matching.
- **Location (25%)**: Campus synonym expansion (e.g. Canteen ↔ Cafeteria ↔ Food Court, Library ↔ Reading Room).
- **Date Proximity (15%)**: Linear proximity decay (Same day = 15%, ≤ 2 days = 12%, ≤ 5 days = 8%).
- **Colour (10%)**: Color family and shade recognition.
- **Brand / Model (10%)**: Exact and contextual entity matching.
- **Description Overlap (10%)**: Token overlap on distinguishing features.

---

## 👥 Demo Accounts (Pre-Seeded)

| Account Role | Name | Email / User ID | Password | Scenario |
|---|---|---|---|---|
| **Administrator** | QuickFinder Admin | `admin@quickfinder.com` (`admin`) | `Admin@123` | Full access to Admin Control Center at `/admin` |
| **Lost Item Owner** | Arun Kumar | `arun@example.com` (`arun_k`) | `Password@123` | Reported lost **Black Samsung Phone** at College Cafeteria |
| **Finder** | Rahul Sharma | `rahul@example.com` (`rahul_s`) | `Password@123` | Uploaded found **Samsung Galaxy Phone** at College Canteen |
| **Finder** | Priya Patel | `priya@example.com` (`priya_p`) | `Password@123` | Uploaded found **MacBook Air**, **Student ID**, **Blue Backpack** |

---

## 🚀 Quick Start (Single-Command Workflows)

### Prerequisites
- Node.js (v20 or newer, v22+ recommended)
- npm

### 1. Unified Local Development (Runs API + Web concurrently)

```bash
# Install all monorepo dependencies
npm install

# Seed the database with realistic demo accounts
npm run db:seed

# Start both API and Web concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`

### 2. Run Comprehensive End-to-End Tests

```bash
npm test
```

Executes the complete 10-step integration test: health probe verification, user registrations, found item uploads, lost report submission, instant multi-factor matching, notification delivery, claim filing, claim acceptance, contact info unlocking, and admin metric aggregation.

### 3. Production Build

```bash
npm run build
```

Generates optimized, code-split production bundles in `apps/web/dist`.

---

## 🐳 Containerized Production Deployment (Docker & Nginx)

### Production Stack (Docker Compose)
Runs the complete containerized stack: Node API + Static Nginx reverse proxy with caching and persistent data volumes:

```bash
# Build and start in background
npm run docker:prod

# Stop the stack
npm run docker:down
```

The application is served at `http://localhost` (Port 80) with static assets cached and `/api/` seamlessly proxied.

### Development Stack (Docker Compose)
Runs with volume bind mounts for live code reloading:

```bash
npm run docker:dev
```

---

## ⚙️ Process Management (PM2 Deployment)

For bare-metal or cloud VM deployments (AWS EC2, DigitalOcean, Ubuntu Server):

```bash
# Start clustered API processes
pm2 start ecosystem.config.js --env production

# Monitor status and logs
pm2 status
pm2 logs quickfinder-api
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Liveness health check | No |
| `GET` | `/api/health` | Deep readiness check (DB status, memory, uptime) | No |
| `POST` | `/api/auth/register` | Register new user with profile photo | No (Rate-limited) |
| `POST` | `/api/auth/login` | Sign in with email or user ID | No (Rate-limited) |
| `GET` | `/api/auth/me` | Get authenticated user details | Yes |
| `PUT` | `/api/auth/profile` | Update profile info & photo | Yes |
| `PUT` | `/api/auth/change-password` | Update account password | Yes |
| `POST` | `/api/lost-items` | Submit lost item report (triggers 2-way match) | Yes |
| `GET` | `/api/lost-items` | Query lost items with filters | No |
| `GET` | `/api/lost-items/:id` | Get lost item details & detected matches | No |
| `PUT` | `/api/lost-items/:id` | Update lost item report | Yes (Owner) |
| `DELETE` | `/api/lost-items/:id` | Delete lost item report | Yes (Owner/Admin) |
| `POST` | `/api/found-items` | Upload found item with photos (triggers 2-way match) | Yes |
| `GET` | `/api/found-items` | Search & filter found items (contact details masked) | No |
| `GET` | `/api/found-items/:id` | Get found item details (contact unlocked if verified) | Optional |
| `PUT` | `/api/found-items/:id` | Update found item listing | Yes (Finder) |
| `DELETE` | `/api/found-items/:id` | Delete found item listing | Yes (Finder/Admin) |
| `GET` | `/api/matches` | Get user's item matches | Yes |
| `GET` | `/api/matches/:id` | Get match breakdown & reasons | Yes |
| `PUT` | `/api/matches/:id/dismiss` | Dismiss match ("NOT MY ITEM") | Yes |
| `POST` | `/api/claims` | Submit ownership claim request with proof photo | Yes |
| `GET` | `/api/claims` | Retrieve sent or received claims | Yes |
| `PUT` | `/api/claims/:id/respond` | Accept or reject claim (Unlocks contact info) | Yes (Finder) |
| `GET` | `/api/notifications` | Get user notifications & unread count | Yes |
| `PUT` | `/api/notifications/:id/read`| Mark notification as read | Yes |
| `PUT` | `/api/notifications/read-all`| Mark all notifications as read | Yes |
| `GET` | `/api/admin/metrics` | System KPI statistics | Admin |
| `GET` | `/api/admin/users` | List registered users & item counts | Admin |
| `PUT` | `/api/admin/users/:id/status`| Toggle user active/disabled status | Admin |
| `GET` | `/api/admin/lost-items` | Moderation view for lost items | Admin |
| `GET` | `/api/admin/found-items` | Moderation view for found items | Admin |
| `GET` | `/api/admin/claims` | Complete claims audit log | Admin |
| `DELETE` | `/api/admin/items/:type/:id` | Delete inappropriate listing | Admin |
| `PUT` | `/api/admin/items/:type/:id/resolve` | Mark item as resolved | Admin |
