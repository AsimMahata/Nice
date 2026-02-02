import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <HashRouter> */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    {/* </HashRouter> */}
  </StrictMode>,
);
