type SessionResumeDraftBase = {
  selectedEmotions: string[];
  incident: string;
  savedAt: string;
};

export type MinimalSessionDraft = SessionResumeDraftBase & {
  kind: "minimal";
  date?: string;
};

export type SessionResumeDraft = MinimalSessionDraft;
