<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

# 🎬 Flex-Watch — Enterprise Movie Discovery & Streaming Platform

A production-grade, distributed movie discovery and streaming web platform inspired by BookMyShow and Netflix. Features a high-performance **React 19** frontend, an **Express BFF (Backend-For-Frontend)** with **Prisma ORM** persistence, multi-tier caching with **singleflight request deduplication**, on-demand **Python ML recommendations**, and full **Docker Compose** containerization.

---

## 🏛️ System Architecture

```
                                [Web Browser / Client]
                                          │
                         (Clerk Auth Token / Guest Session)
                                          │
                                          ▼
                         [Nginx Reverse Proxy & Static Host]
                                          │
                                          ▼
                        [Flex-Watch API Server (Node.js)]
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
        [Security & Resilience]    [Persistence Layer]       [Catalog & ML Engine]
        - Helmet, CORS Protection  - Prisma ORM              - In-Memory LRU Cache
        - Rate Limiting            - SQLite (Local Dev)      - Singleflight Collapsing
        - Structured Pino Logs     - PostgreSQL (Production) - Protected TMDB Secrets
        - Trace IDs (x-request-id) - Watchlist & Bookings    - On-demand ML Serving
```

---

## ✨ Production Highlights

| Feature | Description |
|---|---|
| 🛡️ **Zero Secret Exposure** | TMDB API keys and Clerk credentials live strictly on the backend service. |
| ⚡ **Resilient Caching** | In-memory cache + singleflight promise collapsing eliminates upstream TMDB rate limit spikes and cache stampedes. |
| 🔄 **Database Persistence** | Watchlists ("My List") and booking drafts are persisted via Prisma ORM (SQLite for zero-config dev, PostgreSQL for cloud production). |
| 🤖 **On-Demand ML Recommendations** | ML cosine-similarity matches (~4,800 titles) are served dynamically via API rather than bloated into the client bundle. |
| 🎥 **Interactive Hero Carousel** | Live background video trailers with audio toggle, poster fallback for low-speed connections, and YouTube API sync. |
| 🔍 **Real-Time Catalog & Search** | Live search and multi-genre filtering across trending, popular, upcoming, and top-rated movies & TV series. |
| 🐳 **Full Containerization** | Multi-stage Dockerfiles and `docker-compose.yml` orchestrating PostgreSQL, Redis, Backend API, and Nginx. |
| 🚦 **Automated CI Pipeline** | GitHub Actions validating backend migrations, linting, and 100% frontend test suites on PR/push. |

---

## 📁 Clean Monorepo Directory Structure

```
Flex-Watch/
├── .github/
│   ├── workflows/ci.yml         # GitHub Actions CI (validates backend & frontend)
│   └── PULL_REQUEST_TEMPLATE.md # Standard PR checklist
├── frontend/                    # ⚛️ React 19 Client Application
│   ├── src/                     # Components, pages, layouts, and services
│   ├── public/                  # Static assets (HTML, favicons, manifests)
│   ├── Dockerfile               # Multi-stage production Nginx container
│   ├── nginx.conf               # Nginx reverse proxy & gzip configuration
│   ├── package.json             # Frontend dependencies & scripts
│   └── tailwind.config.js       # Custom cinematic dark theme
├── backend/                     # 🚀 Node.js/Express BFF & API Server
│   ├── prisma/
│   │   └── schema.prisma        # Prisma DB schema (User, Watchlist, Booking)
│   ├── data/
│   │   └── recommendations.json # ML recommendation lookup table (~718 KB)
│   ├── src/
│   │   ├── config/env.js        # Zod environment schema & validation
│   │   ├── db/prisma.js         # Singleton Prisma client
│   │   ├── middlewares/         # Logger (Pino), Auth, ErrorHandler, RateLimiter
│   │   ├── routes/              # Health, Movies, Series, Search, Watchlist
│   │   ├── services/            # Cache (Singleflight), TMDB, Recommendations
│   │   └── server.js            # Express application bootstrap
│   ├── tests/
│   │   └── test_api.js          # Backend integration smoke tests
│   ├── Dockerfile               # Multi-stage backend container (non-root)
│   └── package.json             # Backend dependencies & scripts
├── ml-engine/                   # 🧠 Python Content-Based Recommendation Pipeline
│   ├── export_data.py           # Cosine similarity export script
│   ├── movies_dict.pkl          # Pickled movie dataset
│   └── similarity.pkl           # Pickled cosine similarity matrix
├── docs/                        # Architecture, setup, and feature guides
├── docker-compose.yml           # Production stack (Postgres + Redis + API + Web)
├── package.json                 # Root monorepo workspaces orchestrator
└── .gitignore                   # Multi-tier ignore rules (DBs, envs, logs)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm**: v9+
- **Docker & Docker Compose** *(optional, for containerized run)*

---

### Method 1: Local Monorepo Development (One-Command Run)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Flex-Watch.git
   cd Flex-Watch
   ```

2. **Setup Backend Environment**:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npx prisma db push
   cd ..
   ```

3. **Install Root Workspaces Dependencies**:
   ```bash
   npm install
   ```

4. **Run Full-Stack (Frontend + Backend Concurrently)**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

*Or run individual services:*
- `npm run dev:frontend` (React client only)
- `npm run dev:backend` (Express API only)
- `npm run db:studio` (Open Prisma visual database GUI)

---

### Method 2: Docker Compose (Full Production Stack)

To run the complete production topology (PostgreSQL, Redis, Backend API, and Nginx reverse proxy):

```bash
docker compose up --build -d
```

- **Frontend Web Application**: [http://localhost](http://localhost)
- **Backend API Probes**: [http://localhost/health/ready](http://localhost/health/ready)
- **PostgreSQL Database**: Port `5432`
- **Redis Cache**: Port `6379`

---

## 🧪 Testing

Run backend API smoke tests:
```bash
npm run test:backend
```

Run frontend unit & integration tests:
```bash
npm run test:frontend
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Description | Cache Policy |
|---|---|---|---|
| `GET` | `/health/live` | Liveness check probe | None |
| `GET` | `/health/ready` | Deep check (DB, Cache, TMDB) | Real-time |
| `GET` | `/api/v1/movies/trending` | Weekly/daily trending movies | 30 mins |
| `GET` | `/api/v1/movies/popular` | Popular movies catalog | 1 hour |
| `GET` | `/api/v1/movies/top-rated` | Top-rated movies catalog | 2 hours |
| `GET` | `/api/v1/movies/:id` | Full movie details | 24 hours |
| `GET` | `/api/v1/movies/:id/recommendations` | Dynamic ML recommendations | On-demand |
| `GET` | `/api/v1/watchlist` | Retrieve user watchlist | Authenticated/Guest |
| `POST` | `/api/v1/watchlist` | Add movie to persistent watchlist | Authenticated/Guest |
| `DELETE` | `/api/v1/watchlist/:tmdbId` | Remove item from watchlist | Authenticated/Guest |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request (PR template will guide verification)

---

## 📄 License

This project is for educational and personal use.
