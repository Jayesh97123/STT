import express from "express";

import upload from "../middlewares/upload.middleware.js";

import { transcribeAudio } from "../controllers/transcription.controller.js";

const router = express.Router();

router.post("/transcribe", upload.single("audio"), transcribeAudio);

export default router;
