import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: '0.0.0.0', // This allows Docker to access the dev server
        port: 5173,
        proxy: {
            // // This handles the Socket.io handshake and WebSocket upgrade
            // "/socket.io": {
            //     target: "http://localhost:3000",
            //     ws: true,
            //     changeOrigin: true,
            // },
        }
    }
})
