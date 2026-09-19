import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import transcriptionRoutes from "./routes/transcription.route.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// CORS
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware
app.use(express.json());

// Routes
app.use("/api/stt", transcriptionRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gemini STT API is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
