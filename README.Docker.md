# Web Code Editor - Development Environment

This project uses Docker to provide a consistent environment for the Node.js backend and React/Vite frontend. This ensures that C++ compilers (`g++`) and Node versions are identical across all machines, avoiding the `collect2.exe` linker errors.

## 🛠️ Prerequisites

1.  **Docker Desktop**: [Download and Install](https://www.docker.com/products/docker-desktop/)
2.  **Git**: To clone and manage the repository.

---

## 🚀 How to Start the App

Follow these steps exactly to get the environment running:

1.  **Start Docker Desktop**: Ensure the Docker icon in your system tray is steady (green/running).
2.  **Open your Terminal**: Navigate to the **root folder** of the project (`/Nice`).
3.  **Run the Build Command**:
    ```bash
    docker-compose up --build
    ```
    *This will build the images, install dependencies (inside Linux), and start both services.*

### What to expect:
* **Combined Terminal**: By default, this command will show you the logs for **both** the frontend and backend in one window, color-coded so you can see how they interact.
* **Frontend**: Accessible at `http://localhost:5173`
* **Backend**: Accessible at `http://localhost:3000`

---

## 🖥️ How to Separate the Terminals

If you prefer to have separate windows for the frontend and backend logs (similar to running them locally), follow this "Detached" workflow:

1.  **Start in Detached Mode**:
    ```bash
    docker-compose up -d
    ```
    *The `-d` flag runs the containers in the background.*

2.  **Open Terminal #1 (Backend Logs)**:
    ```bash
    docker-compose logs -f backend
    ```

3.  **Open Terminal #2 (Frontend Logs)**:
    ```bash
    docker-compose logs -f frontend
    ```

---

## 🛑 How to Stop the App

* **To stop and keep the containers**: Press `Ctrl + C` in the combined terminal.
* **To fully shut down and cleanup**: 
    ```bash
    docker-compose down
    ```

---

## 💡 Troubleshooting

* **Port 3000 is busy**: If you see a "bind" error, ensure you have killed any local Node processes running on your Windows host.
* **C++ Execution**: The backend uses the Linux `g++` compiler installed within the container. You do not need to install MinGW or GCC on your local Windows machine anymore.