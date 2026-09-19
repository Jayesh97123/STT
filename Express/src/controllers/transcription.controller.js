import fs from "fs";
import ai from "../config/gemini.js";

export const transcribeAudio = async (req, res) => {
  try {
    console.log("transcribeAudio=> ", req?.file);

    // 1. Check whether audio was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    console.log("Audio file:", req.file.path);

    // 2. Upload audio file to Gemini
    const audioFile = await ai.files.upload({
      file: req.file.path,
      config: {
        mimeType: req.file.mimetype,
      },
    });

    console.log("Gemini file:", audioFile.uri);

    // 3. Ask Gemini to transcribe
    const response = await ai.interactions.create({
      model: "gemini-3.5-transcribe",

      input: [
        {
          type: "audio",
          uri: audioFile.uri,
          mime_type: audioFile.mimeType,
        },
      ],

      generation_config: {
        transcription_config: {
          mode: "smart",

          language_codes: ["en-IN", "hi-IN", "mr-IN"],
        },
      },
    });

    // 4. Get transcription
    const text = response.output_text;

    // 5. Delete local audio file
    fs.unlinkSync(req.file.path);

    // 6. Send result to Angular
    return res.status(200).json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("STT ERROR:", error);

    // Delete uploaded file if something goes wrong
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Speech-to-text failed",
      error: error.message,
    });
  }
};
