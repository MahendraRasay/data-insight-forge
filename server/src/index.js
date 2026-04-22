import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analysisRoutes from "./routes/analysisRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.use("/api", analysisRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Gateway server running on http://localhost:${port}`);
});
