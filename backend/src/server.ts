import express, { Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import cppRoutes from "./routes/cpp.routes.js";
import pythonRoutes from "./routes/python.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import javaRoutes from "./routes/java.routes.js";
import cRoutes from "./routes/c.routes.js";

const app: Express = express()
const httpServer = createServer(app);

app.use(express.json())
app.use(cors())


// app.get("/", (_req, res) => {
//   res.send("Backend OK");
// });

app.use("/api/python", pythonRoutes)
app.use("/api/cpp", cppRoutes);
app.use("/api/ai", aiRoutes)
app.use("/api/java",javaRoutes)
app.use("/api/c",cRoutes)

const io = new Server(httpServer, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("new user connected" + socket.id);
});

export { app, httpServer, io };
