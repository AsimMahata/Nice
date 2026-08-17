import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter as _ } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/Auth/AuthProvider.tsx";
import SettingsProvider from "./contexts/Settings/SettingsProvider.tsx";
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {/* <HashRouter> */}
        <BrowserRouter>
            <AuthProvider>
                <SettingsProvider>
                    <App />
                </SettingsProvider>
            </AuthProvider>
        </BrowserRouter>
        {/* </HashRouter> */}
    </StrictMode>,
);
