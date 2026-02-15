// src/lib/ai.ts
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERRORS_BY_ID,
} from "./constants/errors";
import {
  generateDeepDistortionCard as gptGenerateDeepDistortionCard,
  generateContextualAlternativeThoughts as gptGenerateContextualAlternativeThoughts,
  generateDistortionCard as gptGenerateDistortionCard,
  generateDeepAlternativeThoughts as gptGenerateDeepAlternativeThoughts,
} from "./gpt";
import type { DeepInternalContext } from "./gpt/deepContext";
import { generateDeepInternalContext } from "./gpt/deepContext";
import type { DeepMontagePicture } from "./gpt/deepMontagePicture";
import { generateDeepMontagePicture } from "./gpt/deepMontagePicture";
import type { DeepMontageScenario } from "./gpt/deepMontageScenario";
import { generateDeepMontageScenario } from "./gpt/deepMontageScenario";

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

export async function createDeepInternalContext(
  main: {
    id: number;
    triggerText: string;
    emotions: string[];
    automaticThoughts: string[];
    cognitiveErrors: Array<{ title: string; detail: string }>;
    alternatives: string[];
  },
  subs: Array<{
    id: number;
    triggerText: string;
    emotions: string[];
    automaticThoughts: string[];
    cognitiveErrors: Array<{ title: string; detail: string }>;
    alternatives: string[];
  }>,
): Promise<DeepInternalContext> {
  return generateDeepInternalContext(main, subs);
}

export async function createDeepMontageScenario(
  main: {
    id: number;
    triggerText: string;
    emotions: string[];
    automaticThoughts: string[];
    cognitiveErrors: Array<{ title: string; detail: string }>;
    alternatives: string[];
  },
  subs: Array<{
    id: number;
    triggerText: string;
    emotions: string[];
    automaticThoughts: string[];
    cognitiveErrors: Array<{ title: string; detail: string }>;
    alternatives: string[];
  }>,
): Promise<DeepMontageScenario> {
  return generateDeepMontageScenario(main, subs);
}

export async function createDeepMontagePicture(
  scenario: DeepMontageScenario,
): Promise<DeepMontagePicture> {
  return generateDeepMontagePicture(scenario);
}

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

export async function generateDeepDistortionCard(
  situation: string,
  emotion: string,
  distortionTitle: string,
  internal: DeepInternalContext,
  userHint?: string,
): Promise<DistortionCardGenerationResult> {
  return gptGenerateDeepDistortionCard(
    situation,
    emotion,
    distortionTitle,
    internal,
    userHint,
  );
}

export async function generateDeepAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  internal: DeepInternalContext,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  previousAlternatives: string[],
): Promise<AlternativeThoughtItem[]> {
  return gptGenerateDeepAlternativeThoughts(
    situation,
    emotion,
    thought,
    internal,
    cognitiveErrors,
    previousAlternatives,
  );
}
