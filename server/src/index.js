import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analysisRoutes from "./routes/analysisRoutes.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Start embedded Python service for local URLs; skip only for explicit remote URLs.
const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
const shouldStartEmbeddedPython = /localhost|127\.0\.0\.1/i.test(pythonServiceUrl);
if (shouldStartEmbeddedPython) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pyRoot = path.resolve(__dirname, "../python_service");
  const repoRoot = path.resolve(__dirname, "../..");
  const venvPath = process.env.VIRTUAL_ENV || (fs.existsSync(path.join(repoRoot, ".venv")) ? path.join(repoRoot, ".venv") : "");
  const pythonExecutable = venvPath
    ? process.platform === "win32"
      ? path.join(venvPath, "Scripts", "python.exe")
      : path.join(venvPath, "bin", "python")
    : "python";

  console.log("Starting embedded Python service from:", pyRoot);
  console.log("Using Python executable:", pythonExecutable);
  const uvicorn = spawn(pythonExecutable, ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"], {
    cwd: pyRoot,
    stdio: "inherit",
    shell: true,
  });

  uvicorn.on("error", (err) => {
    console.error("Failed to start uvicorn:", err);
  });

  process.on("exit", () => {
    uvicorn.kill();
  });
}

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
