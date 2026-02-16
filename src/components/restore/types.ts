import type { DeepInternalContext } from "@/lib/gpt/deepContext";

type SessionResumeDraftBase = {
  selectedEmotions: string[];
  incident: string;
  savedAt: string;
};

export type MinimalSessionDraft = SessionResumeDraftBase & {
  kind: "minimal";
  date?: string;
};

export type DeepSessionDraft = SessionResumeDraftBase & {
  kind: "deep";
  mainId: number;
  flowId: number;
  subIds: number[];
  internalContext?: DeepInternalContext;
};

export type SessionResumeDraft = MinimalSessionDraft | DeepSessionDraft;
