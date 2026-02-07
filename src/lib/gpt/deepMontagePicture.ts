import { runGptJson } from "./utils/core/run";
import { parseDeepMontagePictureResponse } from "./utils/deep/parseMontagePicture";
import type { DeepMontageScenario } from "./deepMontageScenario";
import { markAiFallback } from "@/lib/utils/aiFallback";

export type DeepMontagePicture = {
  text: string;
};

const SYSTEM_PROMPT = `
You are an editor who renders an analytic montage into a concise, user-viewable description in Korean.
This is NOT advice, NOT encouragement, and NOT therapy. Do not solve or soothe.

Input will be a montage scenario JSON with atoms, montage sequence, and freeze frames.
Your task:
- Describe the montage as a short Korean narrative image that a user can read.
- Preserve the montage's fragments and cuts; do NOT smooth into a coherent story.
- Avoid generic therapy language.
- No bullet lists. 3–6 short sentences.

Strict output rules:
- Output JSON only.
- Follow the schema exactly.

Output schema (exactly):
{
  "text": "..."
}
`.trim();

export async function generateDeepMontagePicture(
  scenario: DeepMontageScenario,
): Promise<DeepMontagePicture> {
  const prompt = JSON.stringify(scenario);
  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseDeepMontagePictureResponse,
      tag: "deepMontagePicture",
    });
    return parsed;
  } catch (error) {
    console.error("deep montage picture error:", error);
    return markAiFallback({ text: "" });
  }
}
