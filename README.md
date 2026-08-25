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

**N**ice **I**s a **C**ode **E**ditor built for competitive programmers and developers. It combines a Monaco-based editor, an integrated terminal with live PTY, intelligent multi-language code execution with a dedicated 3-Tier Judge Service, and a Competitive Programming Helper (CPH) — all inside a unified desktop application.

> **Status:** Under active development.

---

## ✨ Features

- **Intelligent Multi-Language Code Execution:** Run C, C++, Java, Python, and JavaScript/TypeScript with instant local compiler detection or seamless backend sandbox fallback.
- **Competitive Programming Helper (CPH):** Captures problem test cases directly from online judges (Codeforces, AtCoder, CSES) via a local server and runs cases against your binary or script with real-time verdicts (Accepted, Wrong Answer, TLE, Runtime Error).
- **3-Tier Judge Architecture:** High-performance standalone execution engine supporting warm Docker containers, unprivileged Bubblewrap (`bwrap`) / POSIX `ulimit` sandboxes, and cloud fallback (JDoodle).
- **Language Server Protocol (LSP) Integration:** In-editor intellisense powered by real language servers — `clangd` for C/C++, `Pyright` for Python, and `jdtls` for Java — bridged through a local WebSocket server in the Electron main process.
- **Integrated Terminal:** A full PTY-backed terminal rendered with xterm.js inside the app window, supporting dynamic resizing, persistent sessions, and queued command execution on startup.
- **File Explorer & Workspace:** Browse, open, create, delete, and rename files and directories from inside the editor.
- **AI Error Assistance:** Sends compiler and runtime error outputs to LLMs (Groq's `llama-3.1-8b-instant` / Google Gemini) to surface fast, plain-text explanations and fix recommendations.
- **Custom Snippets:** Per-language snippet management stored locally and synced to user settings.
- **User Accounts & Cloud Sync:** Local, Google OAuth, and GitHub OAuth sign-in with cross-device preferences sync.
- **Configurable Settings:** Custom font family, font size, tab size, word wrap, minimap, auto-save, theme, and execution strategy (`auto`, `local`, `online`).

---

## 🏗️ Architecture

Nice is built as a decoupled, multi-service architecture:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                      Desktop App (Electron + React)                       │
│  • Monaco Editor, xterm.js PTY, LSP Bridges, CPH Helper                   │
│  • Execution Router: Local Terminal vs Backend Judge Service              │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP (POST /api/execute/run)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                             Main Backend API                              │
│  • Express, MongoDB, Auth (OAuth 2.0), Cloud Settings                     │
│  • Thin Proxy Client to Standalone Judge Service                          │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP (POST /execute)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         Standalone Judge Service                          │
│  • Stateless Node.js + TypeScript Service (Port 5001)                     │
│  • In-Memory FIFO Queue with Concurrency & Load Management                │
│  • 3-Tier Dynamic Execution Pipeline                                      │
└───────────┬─────────────────────────┬─────────────────────────┬───────────┘
            │ [Tier 1: Primary]       │ [Tier 2: Sandbox]       │ [Tier 3: Cloud]
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  Warm Docker Workers  │ │   Internal Sandbox    │ │   Online Judge API    │
│  (nice-judge-runner)  │ │ (Bubblewrap / ulimit) │ │       (JDoodle)       │
│ • 100MB RAM / 1 CPU   │ │ • Namespace isolation │ │ • Zero-setup fallback │
│ • Network: disabled   │ │ • Unprivileged user   │ │ • Multi-language API  │
│ • Ephemeral execution │ │ • Containerless hosts │ │ • Cloud redundancy    │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Desktop shell | Electron 40, node-pty, esbuild |
| Frontend | React 19, TypeScript, Vite 7, Monaco Editor, xterm.js, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Judge Service | Express, Dockerode / Docker CLI, Bubblewrap (`bwrap`), POSIX ulimit, JDoodle API |
| Database | MongoDB (via Mongoose), MongoStore for sessions |
| Auth | Passport.js — local, Google OAuth 2.0, GitHub OAuth |
| AI | Groq SDK (`llama-3.1-8b-instant`), Google GenAI |
| Code execution | `child_process` (`exec` / `spawn`), g++, gcc, Java, Python3, Node.js |
| LSP | clangd, Pyright, jdtls — bridged via WebSocket |
| Containerization | Docker + Docker Compose |

---

## 📁 Folder Structure

```text
nice/
├── desktop/                      # Electron + React application
│   ├── electron/                 # Electron main process & IPC modules
│   │   ├── Modules/              # FileSystem, Terminal (PTY), LSP, CPH, Execution
│   │   └── main.ts               # App entrypoint & IPC routers
│   ├── src/                      # React frontend (Monaco, components, contexts)
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # Main Express API server
│   ├── src/
│   │   ├── config/               # Passport strategies, session config
│   │   ├── controllers/          # Route handlers (auth, execute, ai, user, settings)
│   │   ├── db/                   # MongoDB connection
│   │   ├── routes/               # Express routers
│   │   ├── services/judge/       # JudgeClient HTTP bridge
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
    │   ├── services/sandbox/     # SandboxWorker (Bubblewrap / ulimit pool)
    │   ├── services/queue/       # In-memory FIFO ExecutionQueue
    │   ├── services/             # JDoodleExecutor, OnlineJudgeExecutor, JudgeService
    │   ├── utils/logger.ts       # Structured timestamped logger
    │   └── server.ts             # Express Judge entrypoint (Port 5001)
    ├── Dockerfile
    ├── docker-compose.yml
    └── package.json
```

---

## 🛠️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ and [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (recommended for containerized code execution)
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
# Terminal 1: Standalone Judge Service (Port 5001)
cd judge && npm install && npm run dev

# Terminal 2: Main Backend API (Port 3000)
cd backend && npm install && npm run dev

# Terminal 3: Desktop App
cd desktop && npm install && npm run electron:dev
```

---

## ⚙️ Configuration

### 1. Judge Service (`judge/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5001` | Judge service HTTP port |
| `EXECUTION_PROVIDER` | `auto` | Execution strategy: `auto`, `docker`, `sandbox`, or `online` |
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

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port for the Express server |
| `JUDGE_SERVICE_URL` | `http://localhost:5001` | URL of the Standalone Judge Service |
| `MONGO_URI` | `mongodb://localhost:27017/nice` | MongoDB connection string |
| `SESSION_SECRET` | `...` | Secret used to sign session cookies |
| `GOOGLE_CLIENT_ID` | `...` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | `...` | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | `...` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | `...` | GitHub OAuth app client secret |
| `GROQ_API_KEY` | `...` | Groq API key for AI error assistance |
| `API_URL` | `http://localhost:3000` | Public URL of this backend |
| `CLIENT_URL` | `http://localhost:5173` | Public URL of the frontend (for OAuth redirects and CORS) |
| `CPH_PORT` | `27121` | Port used by the local CPH problem capture server |

---

### 3. Frontend Environment (`desktop/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of the backend API (e.g. `http://localhost:3000`) |
| `VITE_BACKEND_DOMAIN` | Domain of the backend (used for cookies/auth) |
| `VITE_TESTING_FOLDER` | Optional: default folder path to open on startup during development |

---

## 🔑 Authentication

Nice supports three sign-in methods:
- **Local** — email + password, hashed with bcrypt.
- **Google OAuth 2.0** — redirects through backend OAuth flow.
- **GitHub OAuth** — redirects through backend OAuth flow.

The desktop app uses a seamless OAuth loopback: when signing in with Google or GitHub, the Electron main process spins up an ephemeral local HTTP server on a random port, opens the OAuth URL in the system browser, and captures the callback token.

Sessions are stored in MongoDB via `connect-mongo` and expire after 30 days.

---

## 🏃 Production Deployment with Docker

### Deploying the Standalone Judge Service
```bash
cd judge
docker compose up --build -d
```
Listens on port `5001` and initializes the warm execution container pool.

### Deploying the Backend API
```bash
cd backend
docker compose up --build -d
```
Listens on port `3000` and proxies execution requests to `JUDGE_SERVICE_URL`.

---

## 📄 License

MIT
