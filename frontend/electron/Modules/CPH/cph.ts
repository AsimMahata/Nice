import express from "express";
import cors from "cors";
import { BrowserWindow } from "electron";

export function setupCPHServer(getMainWindow: () => BrowserWindow | null) {
    const PORT = 10043; 
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get("/", (req, res) => {
        res.send("cph port working!!");
    });

    app.post("/", (req, res) => {
        try {
            const problemData = req.body;
            console.log("Received CPH problem:", problemData.name);

            const mainWindow = getMainWindow();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("cph:problem", problemData);
            }

            res.send("helllooo");
        } catch (err) {
            console.error("Failed to process CPH problem data:", err);
            res.status(400).send("Invalid JSON or bad payload");
        }
    });

    const server = app.listen(PORT, () => {
        console.log(`[CPH Server] Listening on port ${PORT}`);
    });

    return server;
}