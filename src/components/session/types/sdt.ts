import type { SdtKey } from "@/lib/constants/sdt";

export type SdtCard = {
  cardId: string;
  sdtType: SdtKey;
  sdtLabel: string;
  sdtSummary: string;
  sdtDescription: string;
  innerBelief: string;
  empathyText: string;
  behaviorLabel: string;
  behaviorDescription: string;
  behaviorChecklist: string[];
  reflectionQuestion: string;
  isGenerating: boolean;
  errorMessage: string | null;
};
