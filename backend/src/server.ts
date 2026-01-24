import express,{Express} from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors'
import cppRoutes from "./routes/cpp.routes.js"
import aiRoutes from "./routes/ai.routes.js"

const app:Express = express()
const httpServer = createServer(app);

app.use(express.json())
app.use(cors())


app.get("/", (_req, res) => {
  res.send("Backend OK");
});

app.use("/api/cpp", cppRoutes);
app.use("/api/ai", aiRoutes)

const io = new Server(httpServer, {
  cors: { origin: "*" } 
});

io.on("connection", (socket) => {
  console.log("new user connected"+socket.id);
});

export {app, httpServer, io};