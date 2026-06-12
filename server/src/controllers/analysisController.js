import fs from "fs/promises";
import axios from "axios";
import FormData from "form-data";

const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

export async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" });
  }

  const tempFilePath = req.file.path;
  const originalName = req.file.originalname;

  const formData = new FormData();
  formData.append("file", await fs.readFile(tempFilePath), originalName);

  try {
    const response = await axios.post(`${pythonServiceUrl}/analyze`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Analyze request failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to analyze dataset",
      details: error.response?.data || error.message,
    });
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
}

export async function handleChat(req, res) {
  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: "question and context are required" });
  }

  try {
    const response = await axios.post(`${pythonServiceUrl}/chat`, {
      question,
      context,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Chat request failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to answer dataset question",
      details: error.response?.data || error.message,
    });
  }
}

export async function handleDownload(req, res) {
  const payload = req.body;

  try {
    const response = await axios.post(`${pythonServiceUrl}/download`, payload, {
      responseType: "arraybuffer",
    });

    const filename = payload?.filename || "ai_data_insight_report.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(response.data);
  } catch (error) {
    console.error("Download request failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to generate PDF report",
      details: error.response?.data || error.message,
    });
  }
}
