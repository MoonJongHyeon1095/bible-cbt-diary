export type EmotionNote = {
  id: number;
  title: string;
  trigger_text: string;
  created_at: string;
  emotion_tags?: string[];
  inner_belief?: string;
  error_label?: string;
  error_description?: string;
  alternative?: string;
  emotion_labels?: string[];
  error_labels?: string[];
  behavior_labels?: string[];
  thought_details?: EmotionNoteDetail[];
  error_details?: EmotionNoteErrorDetail[];
  alternative_details?: EmotionNoteAlternativeDetail[];
  behavior_details?: EmotionNoteBehaviorDetail[];
};

export type EmotionNoteWithDetails = EmotionNote & {
  thought_details: EmotionNoteDetail[];
  error_details: EmotionNoteErrorDetail[];
  alternative_details: EmotionNoteAlternativeDetail[];
  behavior_details: EmotionNoteBehaviorDetail[];
};

export type EmotionNoteDetail = {
  id: number;
  note_id: number;
  automatic_thought: string;
  emotion: string;
  created_at: string;
};

export type EmotionNoteErrorDetail = {
  id: number;
  note_id: number;
  error_label: string;
  error_description: string;
  created_at: string;
};

export type EmotionNoteAlternativeDetail = {
  id: number;
  note_id: number;
  alternative: string;
  created_at: string;
};

export type EmotionNoteBehaviorDetail = {
  id: number;
  behavior_label: string;
  behavior_description: string;
  is_pinned: boolean;
  latest_tracked_on?: string | null;
  created_at: string;
  checks?: EmotionBehaviorCheck[];
};

export type EmotionBehaviorCheck = {
  id: number;
  behavior_detail_id: number;
  check_label: string;
  sort_order: number;
  created_at: string;
};

export type EmotionBehaviorHistoryCheck = {
  id: number;
  history_id: number;
  check_id: number;
  is_done: boolean;
  check_label?: string;
  created_at: string;
};

export type EmotionBehaviorHistory = {
  id: number;
  tracked_on: string;
  comments: string;
  created_at: string;
  checks: EmotionBehaviorHistoryCheck[];
};
