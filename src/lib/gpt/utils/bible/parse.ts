import { parseJsonObject } from "../core/json";
import { parseInteger } from "../core/number";
import { cleanText } from "../core/text";

export type BibleResultFields = {
  book: string;
  chapter: number | null;
  startVerse: number | null;
  endVerse: number | null;
  verse: string;
  prayer: string;
};

type BibleResponseShape = {
  result?: Partial<BibleResultFields>;
} & Partial<BibleResultFields> & {
    start_verse?: unknown;
    end_verse?: unknown;
  };

export function parseBibleResponse(raw: string): BibleResultFields | null {
  const parsed = parseJsonObject<BibleResponseShape>(raw);
  if (!parsed) return null;

  const r = (parsed.result ?? parsed) as BibleResponseShape;

  return {
    verse: cleanText(r.verse),
    book: cleanText(r.book),
    chapter: parseInteger(r.chapter),
    startVerse:
      parseInteger(r.startVerse) ?? parseInteger(r.start_verse) ?? null,
    endVerse: parseInteger(r.endVerse) ?? parseInteger(r.end_verse) ?? null,
    prayer: cleanText(r.prayer),
  };
}
