import express, { Express } from 'express'
import cors from 'cors'
import cppRoutes from "./routes/cpp.routes.js"
import aiRoutes from "./routes/ai.routes.js"
const app: Express = express()

app.use(express.json())
app.use(cors())


app.get("/", (_req, res) => {
  res.send("Backend OK");
});

app.use("/api/cpp", cppRoutes);
app.use("/api/ai", aiRoutes)
export default app

