export type EmotionNote = {
  id: number;
  title: string;
  trigger_text: string;
  behavior: string | null;
  frequency: number;
  created_at: string;
};

export type CreateEmotionNoteState = {
  ok: boolean;
  message: string;
};
