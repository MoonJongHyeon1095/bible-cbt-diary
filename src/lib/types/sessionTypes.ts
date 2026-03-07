import type { CognitiveErrorId } from "@/lib/constants/errors";
import type { SdtKey } from "@/lib/constants/sdt";

export interface EmotionThoughtPair {
  emotion: string;
  intensity: number | null;
  thought: string;
}

export interface SelectedCognitiveError {
  id?: CognitiveErrorId;
  title: string;
  detail?: string;
}

export interface PositiveSdtSelection {
  sdtType: SdtKey;
  innerBelief: string;
  empathyText: string;
  behaviorLabel: string;
  behaviorDescription: string;
  behaviorChecklist: string[];
  reflectionQuestion: string;
}
