import express, { Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import session from "express-session";
import sessionConfig from "./config/session.js";
import "./config/passport.js";
import passport from "passport";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import executeRoutes from "./routes/execute.routes.js";
import connectDatabase from "./db/database.connection.js";
import bodyParser from "body-parser";

const app: Express = express();
const httpServer = createServer(app);

connectDatabase();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }),
);

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_req, res) => {
    res.send("Backend OK");
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/execute", executeRoutes);

const io = new Server(httpServer, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("new user connected" + socket.id);
});


export { app, httpServer, io };
