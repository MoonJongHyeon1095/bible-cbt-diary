import { safeLocalStorage, safeSessionStorage } from "@/lib/storage/core/safeStorage";
import {
  SESSION_RESUME_DRAFT_KEY,
  SESSION_RESUME_RESTORE_KEY,
} from "@/lib/storage/keys/session";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { SessionResumeDraft } from "./types";

const isValidDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as number[];
  return value
    .map((item) => normalizeNumber(item))
    .filter((item): item is number => item !== null);
};

const normalizeDraft = (value: unknown): SessionResumeDraft | null => {
  if (!value || typeof value !== "object") return null;
  const source = value as {
    kind?: unknown;
    selectedEmotion?: unknown;
    incident?: unknown;
    savedAt?: unknown;
    date?: unknown;
    mainId?: unknown;
    flowId?: unknown;
    subIds?: unknown;
    internalContext?: unknown;
  };
  const kind = String(source.kind ?? "").trim();
  const selectedEmotion = String(source.selectedEmotion ?? "").trim();
  const incident = String(source.incident ?? "");
  const savedAt = String(source.savedAt ?? "").trim() || new Date().toISOString();
  if (!selectedEmotion) return null;

  if (kind === "minimal") {
    return {
      kind: "minimal",
      selectedEmotion,
      incident,
      date: isValidDate(source.date) ? source.date : undefined,
      savedAt,
    };
  }

  if (kind === "deep") {
    const mainId = normalizeNumber(source.mainId);
    const flowId = normalizeNumber(source.flowId);
    const subIds = normalizeIds(source.subIds);
    if (mainId === null || flowId === null || subIds.length > 2) {
      return null;
    }
    return {
      kind: "deep",
      selectedEmotion,
      incident,
      mainId,
      flowId,
      subIds,
      internalContext: source.internalContext as DeepInternalContext | undefined,
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
