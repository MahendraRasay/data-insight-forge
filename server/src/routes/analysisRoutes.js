import express from "express";
import multer from "multer";
import path from "path";
import {
  handleUpload,
  handleChat,
  handleDownload,
} from "../controllers/analysisController.js";

const router = express.Router();

const upload = multer({
  dest: path.resolve("uploads"),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_MB || 500) * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.includes("csv") || file.originalname.endsWith(".csv")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only CSV files are supported"));
  },
});

router.post("/upload", upload.single("file"), handleUpload);
router.post("/chat", handleChat);
router.post("/download", handleDownload);

export default router;
