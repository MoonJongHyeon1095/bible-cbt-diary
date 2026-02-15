import type { CognitiveErrorId } from "@/lib/constants/errors";

export type DistortionCard = {
  cardId: string;
  errorId: CognitiveErrorId;
  errorTitle: string;
  errorDescription: string;
  innerBelief: string;
  analysis: string;
  emotionReason: string;
  isGenerating: boolean;
  errorMessage: string | null;
};
