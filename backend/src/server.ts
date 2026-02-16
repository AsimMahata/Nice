import express, { Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import session from "express-session";
import sessionConfig from "./config/session.js";
import "./config/passport.js";
import passport from "passport";
import cppRoutes from "./routes/cpp.routes.js";
import pythonRoutes from "./routes/python.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import javaRoutes from "./routes/java.routes.js";
import cRoutes from "./routes/c.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import connectDatabase from "./db/database.connection.js";
<<<<<<< HEAD
=======
import bodyParser from "body-parser";
>>>>>>> electron

const app: Express = express();
const httpServer = createServer(app);

connectDatabase();

app.use(express.json());
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
app.use("/api/python", pythonRoutes);
app.use("/api/cpp", cppRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/java", javaRoutes);
app.use("/api/c", cRoutes);
app.use("/api/user", userRoutes);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("new user connected" + socket.id);
});

<<<<<<< HEAD
export { app, httpServer, io };
=======

const cphApp = express();

cphApp.use(express.json());

cphApp.use(cors());
app.use(bodyParser.json());

cphApp.get("/", (req, res) => {
  res.send("cph port working!!");
});

cphApp.post("/", (req, res) => {
  console.log("hello guys, we got the request!!!!!!");
  const problemData = req.body;
  console.log("Received CPH problem:", problemData.name);
  // Emit to all connected frontend clients
  io.emit("cph_problem", problemData);
  res.send("helllooo");
});

export { app, httpServer, io, cphApp };
>>>>>>> electron
