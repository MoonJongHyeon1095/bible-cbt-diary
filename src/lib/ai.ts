// src/lib/ai.ts
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERRORS_BY_ID,
} from "./constants/errors";
import {
  generateContextualAlternativeThoughts as gptGenerateContextualAlternativeThoughts,
  generateDistortionCard as gptGenerateDistortionCard,
} from "./gpt";

// 메타 export (UI에서 사용)
export { COGNITIVE_ERRORS, COGNITIVE_ERRORS_BY_ID };

export type AlternativeThoughtItem = {
  thought: string;
  technique: string;
  techniqueDescription: string;
};

export type DistortionCardGenerationResult = {
  innerBelief: string;
  analysis: string;
  emotionReason: string;
};

export async function generateDistortionCard(
  situation: string,
  emotion: string,
  distortionTitle: string,
  userHint?: string,
): Promise<DistortionCardGenerationResult> {
  return gptGenerateDistortionCard(
    situation,
    emotion,
    distortionTitle,
    userHint,
  );
}

// 3) 대안사고
export async function generateContextualAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  options?: { noteProposal?: boolean },
): Promise<AlternativeThoughtItem[]> {
  return gptGenerateContextualAlternativeThoughts(
    situation,
    emotion,
    thought,
    cognitiveErrors,
    options,
  );
}
