<div align="center">
  <h1>Nice</h1>

  <p>
    <img src="https://img.shields.io/badge/Electron-2B2E3A?logo=electron&logoColor=9FEAF9" alt="Electron" />
    <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/License-MIT-2EA043" alt="License" />
  </p>
</div>

**N**ice **I**s a **C**ode **E**ditor built for competitive programmers. It combines a Monaco-based editor, an integrated terminal, multi-language code execution with a dedicated Docker-based Judge Service, and a competitive programming helper — all in a unified desktop application.

> **Status:** Under active development.

---

## ✨ Features

- **Multi-Language Code Execution:** Run C, C++, Java, and Python code directly from the editor. The backend compiles and executes code in a sandboxed environment with a 4-second time limit to catch infinite loops.
- **Competitive Programming Helper (CPH):** Automatically captures test cases from problem pages via a local server and runs each case against your compiled binary with configurable time limits. Supports C and C++.
- **Language Server Protocol (LSP) Integration:** In-editor intellisense powered by real language servers — `clangd` for C/C++, `Pyright` for Python, and `jdtls` for Java — bridged through a local WebSocket server in the Electron main process.
- **Integrated Terminal:** A full PTY-backed terminal rendered with xterm.js, running inside the app window. Supports resizing, input/output, and graceful cleanup on exit.
- **File Explorer:** Browse, open, create, and rename files and directories from inside the editor. Select a folder to open it as a workspace.
- **AI Error Assistance:** Sends compiler and runtime error output to an LLM (Groq's `llama-3.1-8b-instant`) and surfaces a short, plain-text explanation of the likely cause.
- **Custom Snippets:** Per-language snippet management stored locally and synced to user settings.
- **User Accounts:** Optional account system with local, Google OAuth, and GitHub OAuth sign-in. User settings (editor preferences, theme, font) are persisted server-side when logged in.
- **Editor Settings:** Configurable font family, font size, tab size, word wrap, minimap, auto-save, and more, all backed by Monaco editor options.

## 🏗️ Architecture

Nice is built as a decoupled, multi-service architecture:

```text
┌────────────────────────────────────────────────────────┐
│               Desktop App (Electron + React)           │
│   • Monaco Editor, xterm.js, LSP Bridges, CPH Helper   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (POST /api/execute/run)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Main Backend API                     │
│   • Express, MongoDB, Auth (OAuth), Cloud Settings     │
│   • Thin client to Judge Service (zero execution logic)│
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (POST /execute)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Judge Service (/judge)                 │
│   • Stateless Node.js + TypeScript Service (Port 5001) │
│   • In-Memory FIFO Queue (Max Queue Size limit)        │
│   • WorkerManager (Pool of N Warm Docker Containers)   │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼ (Primary)                     ▼ (Fallback)
┌───────────────────────┐       ┌───────────────────────┐
│  Warm Docker Workers  │       │  Online Judge API     │
│  (nice-judge-runner)  │       │       (JDoodle)       │
│  • Memory: 100MB      │       └───────────────────────┘
│  • Network: none      │
│  • Non-root sandbox   │
└───────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Desktop shell | Electron 40, node-pty, esbuild |
| Frontend | React 19, TypeScript, Vite 7, Monaco Editor, xterm.js, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Database | MongoDB (via Mongoose), MongoStore for sessions |
| Auth | Passport.js — local, Google OAuth 2.0, GitHub OAuth |
| AI | Groq SDK (`llama-3.1-8b-instant`), Google GenAI |
| Code execution | `child_process` (`exec` / `spawn`), g++, gcc, Java, Python3 |
| LSP | clangd, Pyright, jdtls — bridged via WebSocket |
| Containerization | Docker + Docker Compose |

## 📁 Folder Structure

```text
nice/
├── desktop/                      # Electron + React application
│   ├── electron/                 # Electron main process & IPC modules
│   │   ├── Modules/              # FileSystem, Terminal, LSP, CPH, Execution
│   │   └── main.ts               # App entrypoint
│   ├── src/                      # React frontend (Monaco, components, contexts)
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # Main Express API server
│   ├── src/
│   │   ├── config/               # Passport strategies, session config
│   │   ├── controllers/          # Route handlers (auth, cpp, c, java, python, ai, user, settings)
│   │   ├── db/                   # MongoDB connection
│   │   ├── middlewares/          # isLoggedIn guard
│   │   ├── models/               # Mongoose schemas (User, Settings)
│   │   ├── routes/               # Express routers
│   │   ├── utils/                # ApiError, ApiResponse, asyncHandler
│   │   └── server.ts             # App assembly and Socket.IO setup
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
└── judge/                        # Standalone Judge Service
    ├── runner/                   # Execution worker container definition
    │   └── Dockerfile            # Dedicated isolated execution image
    ├── src/
    │   ├── config/               # judge.config.ts (Workers, Memory, Queue limits)
    │   ├── services/docker/      # DockerWorker, WorkerManager, DockerExecutor
    │   ├── services/queue/       # In-memory FIFO ExecutionQueue
    │   ├── services/             # JDoodleExecutor, OnlineJudgeExecutor, JudgeService
    │   ├── utils/logger.ts       # Timestamped structured logger (zero emojis)
    │   └── server.ts             # Express Judge entrypoint (Port 5001)
    ├── Dockerfile
    ├── docker-compose.yml
    └── package.json
```

---

## 🛠️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ and [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (for containerized code execution)
- Language servers in `~/.nice/lsp/` (for in-editor LSP features):
  - **C/C++**: `clangd`
  - **Python**: `pyright`
  - **Java**: `jdtls`

---

### Quick Start (Development)

Run all services concurrently using a single command from the project root:

```bash
npx concurrently -n desktop,backend,judge,electron -c red,green,yellow,blue \
  "npm --prefix ./desktop run dev" \
  "npm --prefix ./backend run dev" \
  "npm --prefix ./judge run dev" \
  "npm --prefix ./desktop run electron:dev"
```

Or start each service in separate terminals:

```bash
# Terminal 1: Judge Service
cd judge && npm install && npm run dev

# Terminal 2: Backend API
cd backend && npm install && npm run dev

# Terminal 3: Desktop App
cd desktop && npm install && npm run electron:dev
```

---

## ⚙️ Configuration

### 1. Judge Service (`judge/.env`)

Configure worker pool and execution parameters in `judge/.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5001` | Judge service HTTP port |
| `EXECUTION_PROVIDER` | `auto` | Execution strategy: `auto`, `docker`, or `online` |
| `JUDGE_WORKERS` | `2` | Number of warm Docker worker containers to maintain |
| `JUDGE_WORKER_MEMORY_MB` | `100` | Memory limit per worker container in MB |
| `JUDGE_WORKER_CPUS` | `1.0` | CPU limit per worker container |
| `JUDGE_WORKER_PIDS_LIMIT` | `128` | Max process limit per worker |
| `JUDGE_MAX_QUEUE_SIZE` | `20` | Max queued execution jobs before returning queue full |
| `JUDGE_EXECUTION_TIMEOUT_MS` | `5000` | Timeout for code execution in ms |
| `JUDGE_DOCKER_IMAGE` | `nice-judge-runner:latest` | Worker image name |
| `ONLINE_JUDGE_PROVIDER` | `jdoodle` | Fallback online judge provider |
| `JDOODLE_CLIENT_ID` | `...` | JDoodle Client ID |
| `JDOODLE_CLIENT_SECRET` | `...` | JDoodle Client Secret |

---

### 2. Backend API (`backend/.env`)

Configure the backend to connect to the Judge Service:

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the Express server (e.g. `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GROQ_API_KEY` | Groq API key for AI error assistance |
| `API_URL` | Public URL of this backend |
| `CLIENT_URL` | Public URL of the frontend (for OAuth redirects and CORS) |
| `CPH_PORT` | Port used by the local CPH problem capture server |

### Frontend Environment Variables

Create `frontend/.env` based on `frontend/.env.example`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of the backend API (e.g. `http://localhost:3000`) |
| `VITE_BACKEND_DOMAIN` | Domain of the backend (used for cookies/auth) |
| `VITE_TESTING_FOLDER` | Optional: default folder path to open on startup during development |

## 🔑 Authentication

Nice supports three sign-in methods:

- **Local** — email + password, hashed with bcrypt.
- **Google OAuth** — redirects through the backend's Google OAuth flow.
- **GitHub OAuth** — redirects through the backend's GitHub OAuth flow.

The desktop app uses a special OAuth flow: when signing in with Google or GitHub from Electron, the main process spins up a temporary local HTTP server on a random port, opens the OAuth URL in the system browser, and waits for the callback. The backend issues a short-lived one-time token, which the desktop app exchanges for a session.

Sessions are stored in MongoDB via `connect-mongo` and expire after 30 days.

## 🏃 Development Workflow

```bash
cd judge
docker compose up --build -d
```
Listens on port `5001` and manages the warm execution worker pool.

### Deploying the Backend API
```bash
cd backend
docker compose up --build -d
```
Listens on port `3000` and proxies execution requests to `JUDGE_SERVICE_URL`.

---

## 📄 License

MIT
