import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";

const getMetaByTitle = (title: string) =>
  COGNITIVE_ERRORS.find((error) => error.title === title);

const parseStringItem = (raw: string): SelectedCognitiveError | null => {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed.title === "string") {
        const meta = getMetaByTitle(parsed.title);
        return {
          id: meta?.id,
          title: parsed.title,
          detail:
            typeof parsed.detail === "string" && parsed.detail.trim()
              ? parsed.detail.trim()
              : undefined,
        };
      }
    } catch {
      // fall through to plain title handling
    }
  }

  const meta = getMetaByTitle(value);
  return {
    id: meta?.id,
    title: value,
  };
};

export const normalizeSelectedCognitiveErrors = (
  value: unknown,
): SelectedCognitiveError[] => {
  if (!Array.isArray(value)) return [];
  const out: SelectedCognitiveError[] = [];

  value.forEach((item) => {
    if (typeof item === "string") {
      const parsed = parseStringItem(item);
      if (parsed) out.push(parsed);
      return;
    }

    if (item && typeof (item as { title?: string }).title === "string") {
      const typed = item as SelectedCognitiveError;
      const meta = getMetaByTitle(typed.title);
      out.push({
        id: typed.id ?? meta?.id,
        title: typed.title,
        detail:
          typeof typed.detail === "string" && typed.detail.trim()
            ? typed.detail.trim()
            : undefined,
      });
    }
  });

  return out;
};
