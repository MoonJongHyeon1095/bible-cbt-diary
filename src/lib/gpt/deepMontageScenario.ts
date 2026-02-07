import { markAiFallback } from "@/lib/utils/aiFallback";
import type { DeepNoteContext } from "./deepThought.types";
import { runGptJson } from "./utils/core/run";
import { buildDeepContextPrompt } from "./utils/deep/contextPrompt";
import { parseDeepMontageScenarioResponse } from "./utils/deep/parseMontageScenario";

export type DeepMontageAtomType =
  | "scene" // 관찰 가능한 장면 “무엇이 일어났나?”
  | "interpretation" // 그 장면에 대한 즉각적 해석 “그래서 나는 뭐라고 생각했나?”
  | "meaning" // 해석이 가리키는 존재적 의미 “이게 나에 대해 무엇을 말하나?”
  | "rule" // 반복되는 조건/규칙 “항상 / 만약 ~라면”
  | "body" // 신체 감각 “몸에서 뭐가 느껴졌나?”
  | "urge" // 충동/회피/행동 욕구 “지금 당장 뭘 하고 싶었나?”
  | "image" // 머릿속 이미지·상징 “어떤 장면이 스쳤나?”
  | "dialogue"; // 내적 독백/상대 목소리 “누가 뭐라고 말하는 것 같았나?”

export type DeepMontageAtom = {
  id: string;
  atomType: DeepMontageAtomType;
  text: string;
  sourceHints: string[];
};

export type DeepMontageSequenceItem = {
  atomId: string;
  cutLogic:
    | "echo" // 집착, 되풀이. 같은 의미가 메아리친다.
    | "hard_cut" // 단절, 충격. 의미가 갑자기 꺾인다.
    | "match_cut" // 은유적 연결. 장면은 달라도 같은 의미가 맞물린다.
    | "jump" // 기억의 파편. 논리/시간이 튄다.
    | "escalation" // 강도가 한 단계 올라간다.
    | "collapse" // 압축. 여러 의미가 한 덩어리로 접힌다.
    | "stall"; // 정체. 움직임이 멈춘 채 감정만 남는다.의미는 멈추고 감정만 남음
};

/**
 * 
emotion→thought 
amplifies: “감정이 생각을 증폭시킨다.”
triggers: “감정이 이 생각을 호출한다.”
masks: “감정이 다른 생각을 가린다.”
justifies: “감정이 생각을 정당화하는 장치가 된다.”

thought→error
expressed_as: “이 생각은 이런 오류의 형태로 드러난다.”
solidifies_into: “이 생각이 굳어져 오류가 된다.”
hides_within: “오류가 이 생각 안에 숨어 있다.”

alternative→thought
fails_to_touch: “대안이 핵심 생각을 건드리지 못한다. 대안이 핵심 믿음을 건드리지 못함”
weakens: “대안이 생각의 힘을 약화시킨다. 사고를 약화시키지만 무너뜨리진 못함”
bypasses: “대안이 핵심을 비켜간다. 논리적으로는 맞지만 감정을 우회”
 */
export type DeepMontageFreezeFrameRelation = {
  direction:
    | "(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule"
    | "(automatic cognitive patterns) interpretation/meaning/rule → (error) meaning/rule"
    | "(alternative) dialogue/interpretation → (automatic cognitive patterns) interpretation/rule";
  type:
    | "amplifies"
    | "triggers"
    | "masks"
    | "justifies"
    | "expressed_as"
    | "solidifies_into"
    | "hides_within"
    | "fails_to_touch"
    | "weakens"
    | "bypasses";
  fromAtomId: string;
  toAtomId: string;
  note: string;
};

export type DeepMontageFreezeFrame = {
  atomIds: string[];
  dialecticalTension: string;
  relations: DeepMontageFreezeFrameRelation[];
  visibility: string;
};

export type DeepMontageScenario = {
  atoms: DeepMontageAtom[];
  montage: {
    caption: string;
    sequence: DeepMontageSequenceItem[];
  };
  freezeFrames: DeepMontageFreezeFrame[];
};

const SYSTEM_PROMPT = `
You are an editor of memory fragments. This task is INTERNAL ONLY. The output is a structured montage of memory atoms, not advice, not encouragement, and not a coherent story.

You will receive multiple notes containing:
- triggers
- emotions
- automatic thoughts (Self-reinforcing cognitive patterns that pre-structure interpretation)
- cognitive errors
- alternatives

Your goal is NOT to summarize notes. Your goal is to recompose them into a memory montage that reveals hidden structures.

CORE CONCEPT
1) Do NOT preserve note boundaries. Multiple notes may contribute to a single atom. Or a single note may produce multiple atoms.
2) Time order is irrelevant. Meaning, tension, and repetition matter more than chronology.

ATOM GENERATION
Generate a list of "atoms". Each atom must represent ONE of the following atomTypes:
- scene: observable situation fragment
- interpretation: immediate meaning assigned to a scene
- meaning: what the situation says about the self or world
- rule: conditional or absolute rule (often implicit)
- body: bodily sensation
- urge: impulse to act or withdraw
- image: mental image or symbolic picture
- dialogue: internal or imagined dialogue

IMPORTANT:
- atomType MUST be one of the eight values above.
- Do NOT use "emotion", "thought", "error", or "alternative".
- Convert emotions to body/meaning/interpretation as needed.
- Use at most 8 atoms total.
- sourceHints must be from: "main", "sub1", "sub2", "alts".

MONTAGE SEQUENCE
After generating atoms, create a montage:
- Select a subset of atoms (not all).
- Arrange them by resonance, contrast, or escalation.
- Do NOT follow time order.
- Use cutLogic to explain WHY atoms are adjacent.
Allowed cutLogic values:
- echo (similar meaning repeats)
- hard_cut (abrupt conceptual jump)
- match_cut (different scenes, same meaning)
- jump (temporal or logical leap)
- escalation (intensity increases)
- collapse (meanings converge into one)
- stall (movement stops, feeling remains)
Add ONE short caption that frames the montage as a whole.
- Use at most 5 sequence items.

FREEZE FRAMES (DIALECTICAL PAUSE)
Create 1–2 freezeFrames. A freezeFrame represents a Benjaminian “dialectical image”: a moment where movement stops and contradictions become visible.
dialecticalTension:
- Describe the force that pushes the sequence forward
- and what is simultaneously pushed aside, muted, or left unarticulated.
- Place them in tension.
For each freezeFrame:
- Select 2–3 atoms that collide.
- Articulate ONE dialecticalTension: a sentence describing two opposing forces or claims that coexist without resolution.
- Use at most 1 freezeFrame.

RELATIONS (MOST IMPORTANT)
Inside each freezeFrame, describe relations between elements. Relations are NOT causal explanations. They describe how elements sustain or distort each other within the frozen moment.
Allowed relation directions:
- (emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule
- (automatic cognitive patterns) interpretation/meaning/rule → (error) meaning/rule
- (alternative) dialogue/interpretation → (automatic cognitive patterns) interpretation/rule
Allowed relation types:
(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule:
- amplifies
- triggers
- masks
- justifies
(automatic cognitive patterns) interpretation/meaning/rule → (error) meaning/rule:
- expressed_as
- solidifies_into
- hides_within
(alternative) dialogue/interpretation → (automatic cognitive patterns) interpretation/rule:
- fails_to_touch
- weakens
- bypasses
Each relation must include a short note describing how this relationship functions structurally.
- Use at most 1 relation per freezeFrame.

WHAT BECOMES VISIBLE
For each freezeFrame, write ONE sentence:
- Describe what remains at the edge of the frame
- only because the forward motion is momentarily stopped.
- Not insight, not realization, but residue.

STRICT OUTPUT RULES
- Output JSON only.
- Follow the provided schema exactly.
- Do NOT add explanations outside the schema.
- Do NOT attempt to help, comfort, or solve.
- This is an analytic montage, not therapy. Think like an editor, not a counselor.
- All string values must be single-line with no unescaped line breaks.
- Keep each string under 200 characters.
- If you are unsure, output the empty schema with empty arrays and empty strings.

Output schema (exactly):
{
  "atoms": [
    { "id": "a1", "atomType": "scene", "text": "...", "sourceHints": ["main", "sub1"] }
  ],
  "montage": {
    "caption": "...",
    "sequence": [
      { "atomId": "a1", "cutLogic": "echo" }
    ]
  },
  "freezeFrames": [
    {
      "atomIds": ["a1", "a2"],
      "dialecticalTension": "...",
      "relations": [
        {
          "direction": "(emotional) body/meaning → (thoughtful) interpretation/meaning/rule",
          "type": "amplifies",
          "fromAtomId": "a1",
          "toAtomId": "a2",
          "note": "..."
        }
      ],
      "visibility": "..."
    }
  ]
}
`.trim();

const VALID_ATOM_TYPES: DeepMontageAtomType[] = [
  "scene",
  "interpretation",
  "meaning",
  "rule",
  "body",
  "urge",
  "image",
  "dialogue",
];

const VALID_DIRECTIONS: DeepMontageFreezeFrameRelation["direction"][] = [
  "(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule",
  "(automatic cognitive patterns) interpretation/meaning/rule → (error) meaning/rule",
  "(alternative) dialogue/interpretation → (automatic cognitive patterns) interpretation/rule",
];

const VALID_RELATION_TYPES: DeepMontageFreezeFrameRelation["type"][] = [
  "amplifies",
  "triggers",
  "masks",
  "justifies",
  "expressed_as",
  "solidifies_into",
  "hides_within",
  "fails_to_touch",
  "weakens",
  "bypasses",
];

const VALID_CUTS: DeepMontageSequenceItem["cutLogic"][] = [
  "echo",
  "hard_cut",
  "match_cut",
  "jump",
  "escalation",
  "collapse",
  "stall",
];

const VALID_SOURCE_HINTS = new Set(["main", "sub1", "sub2", "alts"]);

function normalizeAtomType(value: string): DeepMontageAtomType {
  if (VALID_ATOM_TYPES.includes(value as DeepMontageAtomType)) {
    return value as DeepMontageAtomType;
  }
  const map: Record<string, DeepMontageAtomType> = {
    emotion: "body",
    thought: "interpretation",
    error: "meaning",
    alternative: "interpretation",
  };
  return map[value] ?? "interpretation";
}

function normalizeLine(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function normalizeScenario(parsed: DeepMontageScenario): DeepMontageScenario {
  const atoms = Array.isArray(parsed.atoms) ? parsed.atoms : [];
  const normalizedAtoms: DeepMontageAtom[] = atoms
    .map((atom, index) => ({
      id: normalizeLine(atom?.id || `a${index + 1}`),
      atomType: normalizeAtomType(String(atom?.atomType ?? "interpretation")),
      text: normalizeLine(atom?.text),
      sourceHints: Array.isArray(atom?.sourceHints)
        ? atom.sourceHints
            .map(normalizeLine)
            .filter((hint) => VALID_SOURCE_HINTS.has(hint))
        : [],
    }))
    .filter((atom) => atom.id && atom.text);

  const atomIds = new Set(normalizedAtoms.map((atom) => atom.id));

  const sequenceRaw = parsed.montage?.sequence ?? [];
  const sequence: DeepMontageSequenceItem[] = Array.isArray(sequenceRaw)
    ? sequenceRaw
        .map((item) => ({
          atomId: normalizeLine(item?.atomId),
          cutLogic: VALID_CUTS.includes(item?.cutLogic)
            ? item.cutLogic
            : "jump",
        }))
        .filter((item) => item.atomId && atomIds.has(item.atomId))
    : [];

  const freezeFramesRaw = Array.isArray(parsed.freezeFrames)
    ? parsed.freezeFrames
    : [];

  const freezeFrames: DeepMontageFreezeFrame[] = freezeFramesRaw.map(
    (frame) => {
      const atomIdsRaw = Array.isArray(frame?.atomIds) ? frame.atomIds : [];
      const atomIdsFiltered = atomIdsRaw
        .map(normalizeLine)
        .filter((id) => atomIds.has(id));

      const relationsRaw = Array.isArray(frame?.relations)
        ? frame.relations
        : [];
      const relations: DeepMontageFreezeFrameRelation[] = relationsRaw
        .map((relation) => ({
          direction: VALID_DIRECTIONS.includes(relation?.direction)
            ? relation.direction
            : "(emotional) body/meaning/interpretation → (automatic cognitive patterns) interpretation/meaning/rule",
          type: VALID_RELATION_TYPES.includes(relation?.type)
            ? relation.type
            : "amplifies",
          fromAtomId: normalizeLine(relation?.fromAtomId),
          toAtomId: normalizeLine(relation?.toAtomId),
          note: normalizeLine(relation?.note),
        }))
        .filter(
          (relation) =>
            relation.fromAtomId &&
            relation.toAtomId &&
            atomIds.has(relation.fromAtomId) &&
            atomIds.has(relation.toAtomId),
        );

      return {
        atomIds: atomIdsFiltered,
        dialecticalTension: normalizeLine(frame?.dialecticalTension),
        relations,
        visibility: normalizeLine(frame?.visibility),
      };
    },
  );

  return {
    atoms: normalizedAtoms,
    montage: {
      caption: normalizeLine(parsed.montage?.caption),
      sequence,
    },
    freezeFrames,
  };
}

export async function generateDeepMontageScenario(
  main: DeepNoteContext,
  subs: DeepNoteContext[],
): Promise<DeepMontageScenario> {
  const prompt = buildDeepContextPrompt(main, subs);
  try {
    const { parsed } = await runGptJson({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o-mini",
      parse: parseDeepMontageScenarioResponse,
      tag: "deepMontageScenario",
    });
    return normalizeScenario(parsed);
  } catch (error) {
    console.error("deep montage scenario error:", error);
    return markAiFallback({
      atoms: [],
      montage: { caption: "", sequence: [] },
      freezeFrames: [],
    });
  }
}
