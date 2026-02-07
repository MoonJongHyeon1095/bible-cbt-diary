import { parseJsonObject } from "../core/json";
import { cleanText } from "../core/text";

export type BurnsEmpathyFields = {
  thoughtEmpathy: string;
  emotionEmpathy: string;
  iStatement: string;
  soothing: string;
  observedSelf: string;
};

type BurnsResponseShape = {
  result?: Partial<BurnsEmpathyFields>;
} & Partial<BurnsEmpathyFields>;

export function parseBurnsEmpathyResponse(
  raw: string,
): Partial<BurnsEmpathyFields> | null {
  const parsed = parseJsonObject<BurnsResponseShape>(raw);
  if (!parsed) return null;

  const r = (parsed.result ?? parsed) as Partial<BurnsEmpathyFields>;

  return {
    thoughtEmpathy: cleanText(r.thoughtEmpathy),
    emotionEmpathy: cleanText(r.emotionEmpathy),
    iStatement: cleanText(r.iStatement),
    soothing: cleanText(r.soothing),
    observedSelf: cleanText(r.observedSelf),
  };
}
