import type {
  CognitiveErrorId,
  CognitiveErrorIndex,
} from "@/lib/constants/errors";

export interface EmotionThoughtPair {
  emotion: string;
  intensity: number | null;
  thought: string;
}

export interface SelectedCognitiveError {
  id?: CognitiveErrorId;
  index?: CognitiveErrorIndex;
  title: string;
  detail?: string;
}

export interface SessionHistory {
  id: string;
  timestamp: string;
  userInput: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
  selectedAlternativeThought: string;
  selectedBehavior?: {
    behaviorLabel: string;
    behaviorText: string;
  } | null;
  bibleVerse?: {
    book: string;
    chapter: number | null;
    startVerse: number | null;
    endVerse: number | null;
    verse: string;
    prayer: string;
  } | null;
}
