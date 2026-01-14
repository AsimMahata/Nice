import express from "express";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend OK");
});

app.listen(5000, () => {
  console.log("Backend running on 5000");
});
