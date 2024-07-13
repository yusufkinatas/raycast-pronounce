import * as googleTTS from "google-tts-api";
import * as os from "os";
import * as path from "path";
import https from "https";
import * as child_process from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";

export async function playTTS(text: string, lang: string) {
  const audioUrl = googleTTS.getAudioUrl(text, {
    lang,
    slow: false,
    host: "https://translate.google.com",
  });

  https.get(audioUrl, (response) => {
    const chunks: Uint8Array[] = [];

    response.on("data", (chunk) => {
      chunks.push(chunk);
    });

    response.on("end", () => {
      const audioData = Buffer.concat(chunks);

      const tempFilePath = path.join(os.tmpdir(), "translation.mp3");
      writeFileSync(tempFilePath, audioData);

      // Play the audio file using afplay
      const afplayProcess = child_process.spawn("afplay", [tempFilePath]);

      afplayProcess.on("exit", (code) => {
        if (code !== 0) {
          console.error("Error playing audio");
        }
        if (existsSync(tempFilePath)) {
          unlinkSync(tempFilePath);
        }
      });
    });
  });
}
