import { parseJsonObject } from "../core/json";
import { normalizeTextValue } from "../core/text";
import type { DeepMontagePicture } from "../../deepMontagePicture";

const VALID_CUT_LOGIC = new Set([
  "echo",
  "hard_cut",
  "match_cut",
  "jump",
  "escalation",
  "collapse",
  "stall",
]);

function normalizeCutLogicToken(value: string): string {
  const cleaned = value.toLowerCase().replace(/\s+/g, "");
  const normalized = cleaned.replace(/-/g, "_");
  if (VALID_CUT_LOGIC.has(normalized)) return normalized;
  if (VALID_CUT_LOGIC.has(cleaned)) return cleaned;
  return value.trim();
}

function normalizeCutLogicItem(
  value: unknown,
): DeepMontagePicture["montageText"]["cutLogicText"][number] | null {
  const obj = value as {
    from?: unknown;
    to?: unknown;
    cutLogic?: unknown;
    text?: unknown;
  };

  const from = normalizeTextValue(obj?.from);
  const to = normalizeTextValue(obj?.to);
  const cutLogicRaw = normalizeTextValue(obj?.cutLogic);
  const text = normalizeTextValue(obj?.text);
  const cutLogic = cutLogicRaw ? normalizeCutLogicToken(cutLogicRaw) : "";

  if (!from || !to || !cutLogic || !text) return null;
  return { from, to, cutLogic, text };
}

function normalizeCutLogicText(
  value: unknown,
): DeepMontagePicture["montageText"]["cutLogicText"] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeCutLogicItem).filter(Boolean) as DeepMontagePicture["montageText"]["cutLogicText"];
}

export function createEmptyDeepMontagePicture(): DeepMontagePicture {
  return {
    atomsText: [],
    montageText: {
      caption: "",
      sequenceText: [],
      cutLogicText: [],
    },
    freezeFramesText: [],
  };
}

export function parseDeepMontagePictureResponse(
  raw: string,
): DeepMontagePicture | null {
  const parsed = parseJsonObject<DeepMontagePicture>(raw);
  if (parsed) {
    return {
      ...parsed,
      montageText: {
        caption: normalizeTextValue(parsed.montageText?.caption),
        sequenceText: Array.isArray(parsed.montageText?.sequenceText)
          ? parsed.montageText.sequenceText
          : [],
        cutLogicText: normalizeCutLogicText(parsed.montageText?.cutLogicText),
      },
    };
  }
  return createEmptyDeepMontagePicture();
}
