import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function transcribeAudio(req, res) {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    filePath = req.file.path;

    console.log("Uploading:", req.file.originalname);
    console.log("MIME:", req.file.mimetype);

    // ------------------------------------------------
    // 1. Upload audio to Gemini
    // ------------------------------------------------

    const audioFile = await ai.files.upload({
      file: filePath,
      config: {
        mimeType: req.file.mimetype,
      },
    });

    console.log("Gemini file:", audioFile.uri);

    // ------------------------------------------------
    // 2. Gemini transcription + speaker diarization
    // ------------------------------------------------

    const interaction = await ai.interactions.create({
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
          mode: {
            type: "verbatim",
            diarization_mode: "speaker",
            timestamp_granularities: ["word"],
          },
        },
      },
    });

    // ------------------------------------------------
    // IMPORTANT DEBUG
    // ------------------------------------------------

    console.log("FULL INTERACTION:");

    console.dir(interaction, {
      depth: null,
    });

    // ------------------------------------------------
    // 3. Normal transcript
    // ------------------------------------------------

    const transcript = interaction.output_text || "";

    console.log("OUTPUT TEXT:", transcript);

    // ------------------------------------------------
    // 4. Extract speaker words
    // ------------------------------------------------

    const words = [];

    for (const step of interaction.steps ?? []) {
      for (const content of step.content ?? []) {
        for (const annotation of content.annotations ?? []) {
          if (annotation.type === "word_info") {
            words.push({
              text: annotation.text,
              speaker: annotation.speaker,
              start: annotation.start_offset,
              end: annotation.end_offset,
            });
          }
        }
      }
    }

    console.log("SPEAKER WORDS:");

    console.dir(words, {
      depth: null,
    });

    // ------------------------------------------------
    // 5. Convert words -> speaker messages
    // ------------------------------------------------

    const chat = [];

    let currentSpeaker = null;
    let currentText = "";

    for (const word of words) {
      if (!word.text || !word.speaker) {
        continue;
      }

      if (currentSpeaker === null) {
        currentSpeaker = word.speaker;

        currentText = word.text;

        continue;
      }

      if (word.speaker === currentSpeaker) {
        currentText += " " + word.text;
      } else {
        chat.push({
          speaker: currentSpeaker,

          text: currentText.trim(),
        });

        currentSpeaker = word.speaker;

        currentText = word.text;
      }
    }

    // Last speaker
    if (currentSpeaker && currentText.trim()) {
      chat.push({
        speaker: currentSpeaker,

        text: currentText.trim(),
      });
    }

    // ------------------------------------------------
    // 6. Create Person A/B/C
    // ------------------------------------------------

    const speakerIds = [...new Set(chat.map((message) => message.speaker))];

    const speakerNames = {};

    speakerIds.forEach((speakerId, index) => {
      speakerNames[speakerId] = `Person ${String.fromCharCode(65 + index)}`;
    });

    // ------------------------------------------------
    // 7. Final response
    // ------------------------------------------------

    return res.json({
      success: true,

      text: transcript,

      speakerNames,

      chat,
    });
  } catch (error) {
    console.error("TRANSCRIPTION ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Transcription failed",

      error: error.message,
    });
  } finally {
    // Delete local upload

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
