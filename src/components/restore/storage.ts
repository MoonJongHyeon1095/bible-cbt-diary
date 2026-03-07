import { safeLocalStorage, safeSessionStorage } from "@/lib/storage/core/safeStorage";
import {
  findEmotionById,
  mapEmotionLabelsToIds,
} from "@/lib/constants/emotions";
import {
  SESSION_RESUME_DRAFT_KEY,
  SESSION_RESUME_RESTORE_KEY,
} from "@/lib/storage/keys/session";
import type { SessionResumeDraft } from "./types";

const isValidDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeDraft = (value: unknown): SessionResumeDraft | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as {
    kind?: unknown;
    selectedEmotions?: unknown;
    incident?: unknown;
    savedAt?: unknown;
    date?: unknown;
  };
  const kind = String(source.kind ?? "").trim();
  const selectedEmotions = Array.isArray(source.selectedEmotions)
    ? source.selectedEmotions
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0)
        .slice(0, 2)
    : [];
  const normalizedEmotionIds = selectedEmotions.filter((item) =>
    Boolean(findEmotionById(item)),
  );
  const nextSelectedEmotions =
    normalizedEmotionIds.length > 0
      ? normalizedEmotionIds
      : mapEmotionLabelsToIds(selectedEmotions);
  const incident = String(source.incident ?? "");
  const savedAt = String(source.savedAt ?? "").trim() || new Date().toISOString();
  if (nextSelectedEmotions.length === 0) return null;

  if (kind === "minimal") {
    return {
      kind: "minimal",
      selectedEmotions: nextSelectedEmotions,
      incident,
      date: isValidDate(source.date) ? source.date : undefined,
      savedAt,
    };
  }

  return null;
};

const readDraft = (
  storage: typeof safeLocalStorage | typeof safeSessionStorage,
  key: string,
) => {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeDraft = (
  storage: typeof safeLocalStorage | typeof safeSessionStorage,
  key: string,
  draft: SessionResumeDraft,
) => {
  storage.setItem(key, JSON.stringify(draft));
};

export const saveSessionResumeDraft = (draft: SessionResumeDraft) => {
  writeDraft(safeLocalStorage, SESSION_RESUME_DRAFT_KEY, draft);
};

export const clearSessionResumeDraft = () => {
  safeLocalStorage.removeItem(SESSION_RESUME_DRAFT_KEY);
};

export const readSessionResumeDraft = () =>
  readDraft(safeLocalStorage, SESSION_RESUME_DRAFT_KEY);

export const takeSessionResumeDraft = () => {
  const draft = readDraft(safeLocalStorage, SESSION_RESUME_DRAFT_KEY);
  safeLocalStorage.removeItem(SESSION_RESUME_DRAFT_KEY);
  return draft;
};

export const stashSessionResumeRestoreDraft = (draft: SessionResumeDraft) => {
  writeDraft(safeSessionStorage, SESSION_RESUME_RESTORE_KEY, draft);
};

export const readSessionResumeRestoreDraft = () =>
  readDraft(safeSessionStorage, SESSION_RESUME_RESTORE_KEY);

export const clearSessionResumeRestoreDraft = () => {
  safeSessionStorage.removeItem(SESSION_RESUME_RESTORE_KEY);
};

export const takeSessionResumeRestoreDraft = () => {
  const draft = readDraft(safeSessionStorage, SESSION_RESUME_RESTORE_KEY);
  safeSessionStorage.removeItem(SESSION_RESUME_RESTORE_KEY);
  return draft;
};
