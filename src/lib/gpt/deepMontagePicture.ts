import { markAiFallback } from "@/lib/utils/aiFallback";
import type { DeepMontageScenario } from "./deepMontageScenario";
import { runGptJson } from "./utils/core/run";
import {
  createEmptyDeepMontagePicture,
  parseDeepMontagePictureResponse,
} from "./utils/deep/parseMontagePicture";
import { mapRelationDirectionForPicture } from "./utils/deep/montagePictureHelpers";

export type DeepMontagePicture = {
  atomsText: { atomId: string; label: string; text: string }[];
  montageText: {
    caption: string;
    sequenceText: { atomId: string; label: string; text: string }[];
    cutLogicText: {
      from: string;
      to: string;
      cutLogic: string;
      text: string;
    }[];
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

You will receive ONE JSON input (DeepMontageScenario) with:
- atoms: minimal memory fragments (id, atomType, text)
- montage: caption + sequence (atomId + cutLogic)
- freezeFrames: dialectical pauses (atomIds + dialecticalTension + relations + visibility)

========================
1) INPUT FIELDS (READ-ONLY)
========================
ATOMS
- atoms[].id: atom identifier like "a1"
- atoms[].atomType: one of scene | interpretation | meaning | rule | body | urge | image | dialogue
- atoms[].text: short fragment text

MONTAGE
- montage.caption: short framing line
- montage.sequence[]: ordered list of cuts
  - atomId: references atoms[].id
  - cutLogic: one of echo | hard_cut | match_cut | jump | escalation | collapse | stall

FREEZE FRAMES
- freezeFrames[]:
  - atomIds: 2–3 atom ids that collide
  - dialecticalTension: two opposing forces held together
  - relations[]: at most ONE relation
  - visibility: what becomes faintly visible at the edge when motion stops

RELATION OBJECT (when present)
- relations[0].direction MUST be exactly ONE of these tokens (no other strings):
  - affect_to_pattern
  - pattern_to_error
  - alt_to_pattern
- Meaning (FOR YOU ONLY — do not restate these meanings anywhere in output):
  - affect_to_pattern: 감정적인 의미/해석/감각적 반응이 생각의 자동 패턴을 증폭(amplifies) 또는 촉발(triggers) 또는 은닉(masks) 또는 정당화(justifies) 시킨다.
  - pattern_to_error: 생각의 자동 패턴이 오류 형태로 드러남(expressed_as) 또는 오류로 굳어짐(solidifies_into), 또는 오류가 생각 안에 숨어있음(hides_within).
  - alt_to_pattern: 대안 문장/대안 해석이 생각의 자동패턴의 핵심을 건드리지 못함(fails_to_touch), 또는 자동 패턴을 약화(weakens) 시킴, 또는 대안이 핵심을 비켜가고 감정을 우회(bypasses) 함.
- relations[0].type MUST be one of:
  amplifies | triggers | masks | justifies | expressed_as | solidifies_into | hides_within | fails_to_touch | weakens | bypasses
- relations[0].note: short plain description
IMPORTANT:
- Output the direction token only (exactly as written) in any direction-like field.
- Do NOT copy the meaning text above into any output field.
- Do NOT include arrows (→) or parentheses-explanations anywhere.
- Do NOT put the direction token inside note or any other prose field.

========================
2) YOUR TASK
========================
Render the montage into a concise Korean “narrative image” that a user can read:
- Preserve fragments and cuts; do NOT smooth into a coherent story.
- Avoid generic therapy language.
- 3–6 short sentences total (overall feel: compact, cinematic, analytic).
- You may reuse atom texts, but keep it concise.

========================
3) STRICT OUTPUT RULES
========================
- Output JSON only.
- Korean language only. DO NOT USE ENGLISH.
- Follow the schema exactly.
- No extra keys.
- No bullet lists.
- Keep strings single-line (no unescaped line breaks).

Output schema (exactly):
{
  "atomsText": [{ "atomId":"a1", "label":"장면 1", "text":"..." }],
  "montageText": {
    "caption":"...",
    "sequenceText":[{ "atomId":"a7", "label":"컷 1", "text":"..." }],
    "cutLogicText":[
      { "from":"컷 1", "to":"컷 2", "cutLogic":"echo", "text":"..." }
    ]
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
  const scenarioForPicture = {
    ...scenario,
    freezeFrames: (scenario.freezeFrames ?? []).map((frame) => ({
      ...frame,
      relations: (frame.relations ?? []).map((relation) => ({
        ...relation,
        direction: mapRelationDirectionForPicture(relation.direction),
      })),
    })),
  };
  const prompt = JSON.stringify(scenarioForPicture);
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
