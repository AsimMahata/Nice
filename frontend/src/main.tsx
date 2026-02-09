import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthProvider";
import { SocketProvider } from "./contexts/SocketProvider.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        {/* <HashRouter> */}
        <BrowserRouter>
            <SocketProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </SocketProvider>
        </BrowserRouter>
        {/* </HashRouter> */}
    </StrictMode>,
);
