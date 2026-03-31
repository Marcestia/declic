const path = require("path");
const express = require("express");
require("dotenv").config();
const { sendContactEmails } = require("./lib/contact-mail");

const app = express();
const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.post("/api/contact", async (req, res) => {
  const result = await sendContactEmails(req.body, process.env);
  return res.status(result.status).json(result.body);
});

app.use(express.static(rootDir));

app.get("/", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`DÉCLIC Sculpt Studio listening on http://127.0.0.1:${port}`);
});
