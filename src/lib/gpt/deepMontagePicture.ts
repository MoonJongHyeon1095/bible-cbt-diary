import { markAiFallback } from "@/lib/utils/aiFallback";
import type { DeepMontageScenario } from "./deepMontageScenario";
import { runGptJson } from "./utils/core/run";
import {
  createEmptyDeepMontagePicture,
  parseDeepMontagePictureResponse,
} from "./utils/deep/parseMontagePicture";

export type DeepMontagePicture = {
  atomsText: { atomId: string; label: string; text: string }[];
  montageText: {
    caption: string;
    sequenceText: { atomId: string; label: string; text: string }[];
    cutLogicText: string[];
  };
  freezeFramesText: {
    freezeId: string;
    title: string;
    dialecticalTension: string;
    relationsText: string[];
    whatBecomesVisible: string;
  }[];
};
const SYSTEM_PROMPT = `
You are an editor who renders an analytic montage into a concise, user-viewable description in Korean.
This is NOT advice, NOT encouragement, and NOT therapy. Do not solve or soothe.

Input will be a montage scenario JSON with atoms, montage sequence, and freeze frames.
Your task:
- Describe the montage as a short Korean narrative image that a user can read.
- Preserve the montage's fragments and cuts; do NOT smooth into a coherent story.
- Avoid generic therapy language.
- 3–6 short sentences.

Strict output rules:
- Output JSON only.
- Follow the schema exactly.

Output schema (exactly):
{
  "atomsText": [{ "atomId":"a1", "label":"장면 1", "text":"..." }],
  "montageText": {
    "caption":"...",
    "sequenceText":[{ "atomId":"a7", "label":"컷 1", "text":"..." }],
    "cutLogicText":["컷 1 → 컷 2: echo — ..."]
  },
  "freezeFramesText":[
    {
      "freezeId":"f1",
      "title":"정지화면 1",
      "dialecticalTension":"...",
      "relationsText":["..."],
      "whatBecomesVisible":"..."
    }
  ]
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
    return markAiFallback(createEmptyDeepMontagePicture());
  }
}
