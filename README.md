<div align="center">
  <h1>Nice</h1>

  <p>
    <img src="https://img.shields.io/badge/Electron-2B2E3A?logo=electron&logoColor=9FEAF9" alt="Electron" />
    <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/License-MIT-2EA043" alt="License" />
  </p>
</div>

**N**ice **I**s a **C**ode **E**ditor built for competitive programmers. It combines a Monaco-based editor, an integrated terminal, multi-language code execution, and a competitive programming helper — all in a single desktop app.

> **Status:** Under active development.

## ✨ Features

- **Multi-Language Code Execution:** Run C, C++, Java, and Python code directly from the editor. The backend compiles and executes code in a sandboxed environment with a 4-second time limit to catch infinite loops.
- **Competitive Programming Helper (CPH):** Automatically captures test cases from problem pages via a local server and runs each case against your compiled binary with configurable time limits. Supports C and C++.
- **Language Server Protocol (LSP) Integration:** In-editor intellisense powered by real language servers — `clangd` for C/C++, `Pyright` for Python, and `jdtls` for Java — bridged through a local WebSocket server in the Electron main process.
- **Integrated Terminal:** A full PTY-backed terminal rendered with xterm.js, running inside the app window. Supports resizing, input/output, and graceful cleanup on exit.
- **File Explorer:** Browse, open, create, and rename files and directories from inside the editor. Select a folder to open it as a workspace.
- **Custom Snippets:** Per-language snippet management stored locally and synced to user settings.
- **User Accounts:** Optional account system with local, Google OAuth, and GitHub OAuth sign-in. User settings (editor preferences, theme, font) are persisted server-side when logged in.
- **Editor Settings:** Configurable font family, font size, tab size, word wrap, minimap, auto-save, and more, all backed by Monaco editor options.

## 🏗️ Architecture

Nice is a three-tier desktop application.

### Desktop Shell (Electron)

The Electron main process is the privileged layer. It has full access to Node.js and the OS and exposes a set of named IPC channels to the renderer via a `contextBridge` in `preload.ts`. The renderer has no direct Node.js access; every privileged action (file I/O, spawning processes, launching the terminal, running the LSP bridge) goes through an IPC call.

Electron modules are organized by feature under `electron/Modules/`:

| Module | Responsibility |
|--------|---------------|
| `FileSystem` | Read/write files, create/delete nodes, open folder dialogs |
| `Terminal` | PTY lifecycle (create, write, resize, destroy) via `node-pty` |
| `CodeRunner` | Run source files for quick local execution |
| `CPH` | Local HTTP server to capture test cases; compile + judge runner |
| `WebSocket` | LSP bridge — spawns `clangd`, `pyright`, or `jdtls` and proxies LSP messages |
| `Settings` | Reads/writes `settings.json` in Electron's `userData` directory |
| `Snippets` | Per-language snippet storage alongside settings |
| `SearchEngine` | Shallow directory scanner used for the file search feature |
| `Notification` | Wraps `node-notifier` for native OS notifications |

### Frontend (React + TypeScript)

The React app runs inside the Electron renderer. It communicates with the Electron main process through `window.*` globals exposed by the preload script. For features that require a persistent backend (auth, cloud settings, remote code execution), it connects to the Express API via `axios` and `socket.io-client`.

Key frontend structure:

```
src/
├── components/          # Reusable UI components
│   ├── CodeEditor/      # Monaco editor wrapper with LSP + tab management
│   ├── Terminal/        # xterm.js terminal panel and PTY wiring
│   ├── CphPanel/        # CPH test case UI and verdict display
│   ├── FileEx/          # File explorer tree
│   ├── CodeRunner/      # Code execution panel and output display
│   ├── Settings/        # Settings panel UI
│   └── ...
├── contexts/            # React contexts (Workspace, Editor, Commands, Auth, Settings, Socket)
├── pages/               # Route-level components (Home, Auth/Login, Auth/Register, User/Profile)
├── services/            # Axios service wrappers for the backend API
├── core/                # Keybindings and other core editor configuration
└── utils/               # Shared helpers
```

### Backend (Node.js + Express)

The Express backend handles features that require a server: authentication, cloud settings persistence, and remote code execution. It is entirely optional for local use — the app is functional without it for file editing, terminal use, and local code running.

## 💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Desktop shell | Electron 40, node-pty, esbuild |
| Frontend | React 19, TypeScript, Vite 7, Monaco Editor, xterm.js, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Database | MongoDB (via Mongoose), MongoStore for sessions |
| Auth | Passport.js — local, Google OAuth 2.0, GitHub OAuth |
| Code execution | `child_process` (`exec` / `spawn`), g++, gcc, Java, Python3 |
| LSP | clangd, Pyright, jdtls — bridged via WebSocket |
| Containerization | Docker + Docker Compose |

## 📁 Folder Structure

```text
nice/
├── backend/                      # Express API server
│   ├── src/
│   │   ├── config/               # Passport strategies, session config
│   │   ├── controllers/          # Route handlers (auth, cpp, c, java, python, user, settings)
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
└── frontend/                     # Electron + React app
    ├── electron/
    │   ├── main.ts               # Electron main process, IPC handlers
    │   ├── preload.ts            # contextBridge — exposes APIs to renderer
    │   ├── Modules/              # Feature modules (see table above)
    │   └── types/                # Shared TypeScript types for IPC
    ├── src/
    │   ├── components/           # UI components
    │   ├── contexts/             # React contexts
    │   ├── core/                 # Keybindings
    │   ├── pages/                # Route pages
    │   ├── services/             # Backend API clients
    │   └── utils/                # Helpers
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/)
- For C/C++ execution and LSP: `g++` / `gcc` on your `PATH`
- For Java execution and LSP: JDK 17+ on your `PATH`
- For Python execution and LSP: Python 3 on your `PATH`
- Language servers must be installed manually to `~/.nice/lsp/`:
  - C/C++: `clangd` → `~/.nice/lsp/clangd/bin/clangd.exe`
  - Python: `pyright` → `~/.nice/lsp/pyright/node_modules/.bin/pyright-langserver.cmd`
  - Java: `jdtls` → `~/.nice/lsp/jdtls/jdtls.cmd`

### Running the Desktop App (Development)

```bash
# Clone the repository
git clone https://github.com/AsimMahata/nice.git
cd nice/frontend

# Install dependencies
npm install

# Start in development mode (launches Vite + Electron)
npm run electron:dev
```

This builds the Electron TypeScript, starts Vite on `http://localhost:5173`, and opens the Electron window pointed at the dev server.

### Running the Backend (Optional)

The backend is required only for user accounts, cloud settings, and remote code execution.

```bash
cd nice/backend

# Copy the example env file and fill in values
cp .env.example .env

# Install dependencies
npm install

# Start in development mode
npm run dev
```

Or run with Docker:

```bash
cd nice/backend
docker-compose up
```

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` based on `backend/.env.example`:

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the Express server (e.g. `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
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
# Frontend — run Vite dev server only (browser preview)
cd frontend
npm run dev

# Frontend — run in Electron with hot reload
npm run electron:dev

# Frontend — rebuild Electron TypeScript after changes to electron/ files
npm run electron:build

# Frontend — production build + Electron
npm run electron:prod

# Backend — development with nodemon
cd backend
npm run dev

# Backend — compile TypeScript
npm run build

# Backend — run compiled output
npm start
```

## 📄 License

MIT
