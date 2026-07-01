# 📊 QuantCoach AI — Trading Journal & AI Coach

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![Gemini](https://img.shields.io/badge/Gemini_3.5_Flash-1A73E8?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

QuantCoach AI is a premium, feature-rich web-based **Trading Journal & AI Coaching platform** designed for stock, options, and futures traders. It combines traditional performance tracking with advanced cognitive and psychological coaching powered by a **Neo4j Knowledge Graph** and **Google Gemini AI**.

> 💡 **The Hybrid Edge:** Log your trades manually in real-time or import broker statements (e.g., Groww F&O Excel reports) automatically in one click. Dictate your journal logs or chat with your AI Trading Coach using voice inputs.

---

## ⚡ Quick Feature Matrix

| Feature | Powered By | What It Does | Key Benefit |
| :--- | :--- | :--- | :--- |
| **🧠 AI Trading Coach** | `Neo4j` + `Gemini` | retrieval-augmented text/voice chat with memory | Identifies cognitive traps and prevents emotional overtrading. |
| **🎙️ Voice Logging & Journal** | `Gemini Whisperer` | Converts raw speech into structured trades or journals | Hands-free trading journal entries on-the-go. |
| **📊 Advanced Analytics** | `FastAPI` + `React` | Dynamic Win-Rate donut, asset class performance metrics | Clear view of which strategies and assets make money. |
| **📅 Interactive Calendar** | `Tailwind` + `Zustand` | Color-coded profit/loss daily visualizer | Quick historical lookup by clicking specific dates. |
| **📤 One-Click Broker Import** | `Python Pandas` | Maps raw broker Excel sheets to standard contracts | Converts messy files to clean trading logs instantly. |
| **✏️ AI Notes Refiner** | `Gemini API` | Converts messy trade notes to clean markdown | Professional trade post-mortems in seconds. |

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

### 6. AI Trading Psychology Coach
* **Retrieval-Augmented Generation (RAG):** Chats with the AI Coach incorporate a structured knowledge graph representation of your trade history, daily mindset logs, and psychological patterns.
* **Context-Aware Recommendations:** Analyzes your recurring mistakes (like FOMO, overtrading, or revenge trading) and emotional trends over time to give personalized discipline guidelines.
* **Conversational & Voice Enabled:** Communicate via standard text messages or voice recordings with automated speech-to-text translation.

### 7. Voice Journaling & Logging
* **Hands-Free Trade Parameter Logging:** Upload a spoken voice log (e.g., webm, wav audio file) to extract structured trade parameters like entry price, stock ticker, quantity, strategy, and notes automatically via Gemini.
* **Audio Voice Journaling:** Dictate daily journal notes. The system transcribes the speech, extracts core emotions, strategies used, and mistakes committed, and compiles them into structured daily nodes.

### 8. AI Notes Refiner
* **Messy-to-Markdown Transformation:** Directly convert raw, unstructured trade notes into professional, structured post-mortems with one click inside the Trade History feed.

---

## 🛠️ Technology Stack

### Backend (API Services)
* **Framework:** FastAPI (Python 3.10+)
* **Database ORM:** SQLAlchemy (v2.0+) with Alembic migrations
* **Relational Database:** MySQL 8.0
* **Graph Database (Memory):** Neo4j (v5.12) with APOC plugins for user-specific trading memory and mental mapping
* **In-Memory Cache:** Redis 7.0 (OTP management, caching)
* **AI Services:** Gemini 3.5 Flash (via Interactions API) for voice transcription, entity extraction, and psychological coaching
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
Run the following in the root directory to spin up the MySQL, Redis, and Neo4j containers:
```bash
docker compose up -d
```
* **MySQL:** Exposed on port `3307`
* **Redis:** Exposed on port `6379`
* **Neo4j:** Exposed on port `7474` (HTTP console) and `7687` (Bolt protocol)

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

   # AI Integration
   GEMINI_API_KEY=your-gemini-api-key-here

   # Neo4j Graph DB Configuration
   GRAPH_URI=bolt://localhost:7687
   GRAPH_USER=neo4j
   GRAPH_PASSWORD=trading@12004
   NEO4J_AUTH=neo4j/trading@12004
   NEO4J_PLUGINS=["apoc"]
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

## 📊 System Flow Diagrams

The following diagrams illustrate the application's flow, data ingestion paths, and AI-driven Retrieval-Augmented Generation (RAG) loops.

### 1. Application Architecture & High-Level Flow
This diagram details how the trader interacts with the frontend React Single Page Application (SPA), which routes queries through the FastAPI gateway, managing authentication in Redis, logging transaction/trade logs in MySQL, and indexing psychological/strategy mappings in Neo4j while executing AI features via the Gemini API.

```mermaid
flowchart TD
    %% Entities
    User([Trader])
    
    subgraph Frontend [React SPA - Vite]
        UI[User Interface]
        AuthStore[Zustand Auth Store]
        TQuery[TanStack Query]
        AxiosClient[Axios client with Refresh Interceptor]
    end

    subgraph Backend [FastAPI Application]
        APIRouter[FastAPI APIRouter]
        Security[Security JWT Auth]
        Parser[Broker Statement Parser]
        AIService[AI Service - Gemini API]
        GraphService[Graph Memory Service]
    end

    subgraph Storage [Databases & Services]
        MySQL[(MySQL 8.0 DB)]
        Redis[(Redis Cache & OTP)]
        Neo4j[(Neo4j Graph Database)]
    end

    %% Interactions
    User <-->|Interacts| UI
    UI <--> TQuery
    TQuery <--> AxiosClient
    AxiosClient <-->|HTTPS /api/v1| APIRouter
    
    APIRouter --> Security
    Security -->|Token Rotation| Redis
    
    %% Trade Flow
    APIRouter -->|Parse Excel| Parser
    Parser --> MySQL
    
    %% Journal Ingestion & Entity Extraction
    APIRouter -->|Save Journal| MySQL
    APIRouter -->|Trigger Graph Sync| GraphService
    GraphService -->|Extract Entities| AIService
    GraphService -->|Write Nodes & Relations| Neo4j
    
    %% AI Coach Flow
    APIRouter -->|Query Context| GraphService
    GraphService -->|Retrieve Cypher Context| Neo4j
    APIRouter -->|Augment Prompt & Run Chat| AIService
    AIService -->|Coaching Response| UI
```

---

### 2. Journaling & Graph Ingestion Data Flow
When a daily journal entry is saved, it is committed to MySQL and synced to the Graph memory. The backend sends the text to the Gemini API, using a structured JSON schema, to extract emotional states, strategies, mistakes, and lessons. These entities are then converted into graph nodes and relationships in Neo4j.

```mermaid
flowchart LR
    JournalInput[Raw Daily Journal / Voice Recording] --> Ingestion[FastAPI /api/v1/journal]
    Ingestion --> MySQLSave[Write raw entry to MySQL]
    Ingestion --> Extraction[Graph Memory Service]
    
    subgraph Gemini Extraction [Gemini 3.5 Flash]
        Extraction -->|Prompt + JSON Schema| Gemini[Gemini API]
        Gemini -->|Extracted JSON| Parsing[Parse Entities]
    end

    Parsing -->|Structured JSON| Neo4jSync[Sync to Neo4j]
    
    subgraph Graph Nodes
        Neo4jSync -->|MERGE| UserNode(User Node)
        Neo4jSync -->|CREATE| JournalNode(JournalEntry Node)
        Neo4jSync -->|MERGE| EmotionNode(Emotion Node)
        Neo4jSync -->|MERGE| StrategyNode(Strategy Node)
        Neo4jSync -->|MERGE| MistakeNode(Mistake Node)
        Neo4jSync -->|MERGE| LearningNode(Learning Node)
    end
    
    UserNode -->|LOGGED_JOURNAL| JournalNode
    JournalNode -->|FEARED_OR_FELT| EmotionNode
    JournalNode -->|USED_STRATEGY| StrategyNode
    JournalNode -->|COMMITTED_MISTAKE| MistakeNode
    JournalNode -->|REINFORCED_LEARNING| LearningNode
```

---

### 3. AI Coach Retrieval-Augmented Generation (RAG) Flow
When the user requests psychological guidance or chats with the AI Coach (text or voice), the backend queries the Neo4j graph database to retrieve aggregated insights on the trader's emotional trends, recurring mistakes, strategies, and the 5 most recent journal logs. This graph context is loaded into the system prompt and sent to Gemini to generate highly personalized, contextual feedback.

```mermaid
sequenceDiagram
    autonumber
    actor Trader as Trader (UI)
    participant API as FastAPI Backend
    participant Neo4j as Neo4j Graph DB
    participant Gemini as Gemini API (Interactions)
    
    Trader->>API: Send coaching question (text or voice)
    Note over API: If voice, transcribe audio to text first using Gemini
    API->>Neo4j: Query trader's historical context (user_id)
    Note over Neo4j: Run MATCH queries to aggregate emotions, strategies, mistakes & fetch 5 recent journal entries
    Neo4j-->>API: Return aggregated graph metrics & recent entries
    API->>API: Build System Prompt containing knowledge graph data
    API->>Gemini: call client.interactions.create with user question & augmented System Instructions
    Gemini-->>API: Return personalized coaching advice
    API-->>Trader: Return advice response (concise markdown)
```

---

## 🔒 Security & Performance Features
* **Seamless JWT Token Rotation:** Custom Axios interceptor catches `401 Unauthorized` responses and automatically triggers `/auth/refresh` using HTTP-Only cookies to acquire a new short-lived token without interrupting the user.
* **Cached Server State:** Query caches automatically invalidate on creation, deletion, or edits, ensuring immediate UI reactivity across all tabs.
