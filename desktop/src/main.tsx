import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/Auth/AuthProvider.tsx";
import SettingsProvider from "./contexts/Settings/SettingsProvider.tsx";

if (import.meta.env.DEV) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/react-scan/dist/auto.global.js";
    document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <HashRouter>
            <AuthProvider>
                <SettingsProvider>
                    <App />
                </SettingsProvider>
            </AuthProvider>
        </HashRouter>
    </StrictMode>,
);
