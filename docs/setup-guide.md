# 🛠️ Setup & Running Guide

Complete instructions for setting up, configuring, and running **Flex-Watch** in local development mode or via Docker containerization.

---

## 1. Prerequisites

Ensure you have the following installed on your operating system:

| Dependency | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Node.js** | `v18.0.0` | `v20.x LTS` | Required for both frontend and backend |
| **npm** | `v9.0.0` | `v10.x+` | Package manager supporting npm workspaces |
| **Docker & Docker Compose** | Latest | Latest | Required only for containerized deployment |
| **Python** | `3.9+` | `3.11+` | Required only if re-running the ML training script |

---

## 2. Environment Configuration

### Root Environment (`.env`)
Create a `.env` file in the repository root by copying `.env.example`:
```bash
cp .env.example .env
```
Populate the values:
```env
# TMDB API Key (Get a free key at https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key_here

# Clerk Authentication (Get keys at https://dashboard.clerk.com)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# PostgreSQL Credentials (Used when running via Docker Compose)
POSTGRES_USER=flexwatch_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=flexwatch_db
```

### Backend Environment (`backend/.env`)
Create `backend/.env` for local backend development:
```bash
cd backend
cp .env.example .env
cd ..
```
Default local settings:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
TMDB_API_KEY=your_tmdb_api_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

---

## 3. Method 1: Local Development (Fastest, Zero-Config)

This mode runs the backend on Node.js using a local zero-config **SQLite** database (`backend/dev.db`), and the React frontend on the lightning-fast **Vite 6** HMR dev server.

### Step 1: Install All Monorepo Dependencies
From the repository root:
```bash
npm install
```
*npm will automatically link the `frontend` and `backend` workspaces.*

### Step 2: Initialize the Database
Push the Prisma schema to generate your local SQLite database:
```bash
npm run db:push
```

### Step 3: Start Both Backend & Frontend
Run the concurrent development script:
```bash
npm run dev
```

* **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
* **Backend API Server**: [http://localhost:5000](http://localhost:5000)
* **Backend Health Check**: [http://localhost:5000/health/ready](http://localhost:5000/health/ready)

### Step 4: (Optional) Run Services Individually
If you want to run services in separate terminal windows:
```bash
# Terminal 1: Backend only
npm run dev:backend

# Terminal 2: Frontend only
npm run dev:frontend
```

---

## 4. Method 2: Docker Compose (Full Production Topology)

This mode launches the complete enterprise topology:
- **PostgreSQL 16** container with volume persistence
- **Redis 7** in-memory cache container
- **Express API** container (running under non-root user `flexwatch`)
- **Nginx Web Server** container hosting the React production bundle with gzip compression and reverse proxying `/api/` requests to the backend.

### Launch Stack
From the repository root:
```bash
docker compose up --build -d
```

### Monitor Services
```bash
# View running containers and health status
docker compose ps

# View live logs
docker compose logs -f
```

* **Web Application**: [http://localhost](http://localhost) (Port 80)
* **API Health Check**: [http://localhost/health/ready](http://localhost/health/ready)
* **PostgreSQL Port**: `5432`
* **Redis Port**: `6379`

### Stop Stack
```bash
docker compose down
```
*(To erase all database volume data as well, add the `-v` flag: `docker compose down -v`)*

---

## 5. Database Management Commands

Flex-Watch uses **Prisma ORM**. Run these commands from the root:

| Command | Action |
|---|---|
| `npm run db:push` | Syncs `schema.prisma` directly to the active database (SQLite/Postgres). |
| `npm run db:generate` | Regenerates the `@prisma/client` JavaScript library. |
| `npm run db:studio` | Launches **Prisma Studio** at `http://localhost:5555` to visually view/edit all database records. |

---

## 6. Running Automated Tests

### Run All Tests
```bash
npm test
```
*Runs backend API smoke tests first, followed by the frontend unit and integration test suites.*

### Run Tests Individually
```bash
# Backend smoke tests only (validates health, cache, and watchlist CRUD)
npm run test:backend

# Frontend tests only (validates components, mock API, and router flows)
npm run test:frontend
```

---

## 7. Regenerating ML Recommendations (Optional)

If you have updated the movie training dataset (`movies_dict.pkl` and `similarity.pkl`):

1. Navigate to the ML engine:
   ```bash
   cd ml-engine
   ```
2. Install Python dependencies:
   ```bash
   pip install pandas scikit-learn
   ```
3. Run the export script:
   ```bash
   python export_data.py
   ```
   *The script automatically recalculates the cosine similarity recommendations and exports `recommendations.json` into `backend/data/` for immediate server usage.*
