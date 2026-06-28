# 📊 QuantCoach AI — Trading Journal

QuantCoach AI is a premium, feature-rich web-based **Trading Journal** designed to help stock, options, and futures traders track their historical performance, analyze win rates, log capital adjustments, and visualize their daily outcomes.

The application features a hybrid workflow: log your trades manually in real-time or drop an Excel report to import them in bulk automatically.

---

## 🚀 Key Features

### 1. Hybrid Trade Logging
* **Manual Logger:** Log Stock, Options, or Futures trades with customizable entry/exit prices, quantities, strategy tags, execution times, and notes.
* **Automated Broker Importer:** Import broker statements (e.g., Groww F&O Excel reports) in one click. The importer:
  * Maps raw quantities to standard contracts/lots.
  * Dynamically computes premium-based P&L.
  * Matches historical execution dates (`timestamps`) automatically.
  * Provides a confirmation modal to review trades before importing.

### 2. Comprehensive Analytics Dashboard
* **Dynamic Metric Cards:** View Net P&L, Win Rate (W/L ratio), Starting Capital (Deposits minus Withdrawals), and Current Account Balance.
* **Interactive Visuals:** 
  * A circular **Wins vs. Losses Donut Chart** to track win ratios.
  * **Asset Class Performance Panel:** Detailed breakdown of Stocks, Options, and Futures showing separate net P&L, win rate, and trade counts.
* **Timeframe Filters:** Easily toggle metrics for the last 30, 60, 90 days, or filter by a custom date range.

### 3. Interactive Trading Calendar
* A color-coded calendar mapping green (profit) and red (loss) days.
* Click on any calendar day to jump directly to the trades logged for that date.

### 4. Trade History Feed
* Trade logs are grouped day-by-day in descending order.
* Advanced filters to query by asset class, period (Today, Month), or custom months/dates.
* UI-optimized wrapping Strategy tags and Notes columns to prevent overflow on wide screens.
* Inline actions to update or delete trade records.

### 5. High-Conversion Landing Page
* **Interactive Navigation:** Simplified header featuring a click-to-open **Features** dropdown (with outside click detection) highlighting real journal assets.
* **Direct Access Workflow:** CTA links redirect straight to `/login` (with session checks) instead of a multi-tier SaaS trial.
* **Localized Mockups:** Pre-visualized metrics displayed in Indian Rupees (₹) to represent regional asset class integration.

---

## 🛠️ Technology Stack

### Backend (API Services)
* **Framework:** FastAPI (Python 3.10+)
* **Database ORM:** SQLAlchemy (v2.0+) with Alembic migrations
* **Relational Database:** MySQL 8.0
* **In-Memory Cache:** Redis 7.0 (OTP management, caching)
* **Auth System:** Short-lived JWT access tokens (15 mins) + Long-lived HTTP-only cookies refresh tokens (30 days) with rotation logic.

### Frontend (Single Page App)
* **Framework:** React 19 + Vite (Type: ES Module)
* **Styling:** TailwindCSS v3.4 (custom responsive panels, glassmorphism shadows)
* **State Management:** Zustand
* **Async Server State:** **TanStack Query** (React Query v5) for automatic caching and invalidation
* **Icons & Notifications:** Lucide React & Sonner Toast Engine

---

## 📁 Project Structure

```text
Trading_Journal/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API Route Handlers (V1)
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic Validation Schemas
│   │   ├── services/         # Business Logic (Trade computations, Broker Statement Parser)
│   │   ├── config.py         # App Config Settings
│   │   └── main.py           # FastAPI Entry point
│   ├── alembic/              # DB Migrations
│   ├── requirements.txt      # Python Dependencies
│   └── .env                  # Backend Secrets (DB_URL, JWT_SECRET, etc.)
│
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── api/              # Axios HTTP client with auto-refresh interceptors
│   │   ├── components/       # Reusable UI Components (History, Importer, Calendar, Logger)
│   │   ├── hooks/            # TanStack Query Hook wrappers
│   │   ├── pages/            # Page layouts (Dashboard, Login, Register)
│   │   └── store/            # Zustand global state (Auth Store)
│   ├── package.json          # Node Dependencies
│   ├── vite.config.js        # Vite config with dev server proxy settings
│   ├── .env                  # Frontend environment variables (Vite proxy config)
│   └── tailwind.config.cjs   # Tailwind Configuration
│
└── docker-compose.yml        # Docker compose for MySQL & Redis
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
Make sure you have the following installed:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/) (3.10+)

---

### 💻 Installation & Setup

#### 1. Start Services via Docker Compose
Run the following in the root directory to spin up the MySQL and Redis containers:
```bash
docker compose up -d
```
* **MySQL:** Exposed on port `3307`
* **Redis:** Exposed on port `6379`

#### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   # inside Windows PowerShell / terminal
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows Activation:
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` folder:
   ```ini
   DATABASE_URL=mysql+pymysql://user:password@localhost:3307/trading_journal
   JWT_SECRET_KEY=generate-a-secure-random-key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   EMAILS_ENABLED=False
   ```
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The API docs will be available at `http://localhost:8000/docs`

#### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file inside the `frontend/` folder:
   ```ini
   VITE_BACKEND_TARGET=http://localhost:8000
   VITE_API_URL=/api/v1
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   * The application will run locally at `http://localhost:5173/`

---

## 🔒 Security & Performance Features
* **Seamless JWT Token Rotation:** Custom Axios interceptor catches `401 Unauthorized` responses and automatically triggers `/auth/refresh` using HTTP-Only cookies to acquire a new short-lived token without interrupting the user.
* **Cached Server State:** Query caches automatically invalidate on creation, deletion, or edits, ensuring immediate UI reactivity across all tabs.
