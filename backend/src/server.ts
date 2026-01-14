import express, {Express} from 'express'
import cors from 'cors'


const app:Express = express()

app.use(express.json())
app.use(cors())


app.get("/", (_req, res) => {
  res.send("Backend OK");
});

export default app

