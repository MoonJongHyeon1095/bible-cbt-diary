// src/lib/ai.ts
// gpt
import type { CognitiveBehaviorId } from "./constants/behaviors";
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERRORS_BY_ID,
  COGNITIVE_ERRORS_BY_INDEX,
} from "./constants/errors";
import {
  analyzeCognitiveErrorDetails as gptAnalyzeCognitiveErrorDetails,
  analyzeDeepCognitiveErrorDetails as gptAnalyzeDeepCognitiveErrorDetails,
  generateBehaviorSuggestions as gptGenerateBehaviorSuggestions,
  generateBibleVerse as gptGenerateBibleVerse,
  generateBurnsEmpathy as gptGenerateBurnsEmpathy,
  generateContextualAlternativeThoughts as gptGenerateContextualAlternativeThoughts,
  generateDeepAlternativeThoughts as gptGenerateDeepAlternativeThoughts,
  generateDeepSdtAutomaticThoughts as gptGenerateDeepSdtAutomaticThoughts,
  generateExtendedAutomaticThoughts as gptGenerateExtendedAutomaticThoughts,
  rankCognitiveErrors as gptRankCognitiveErrors,
  rankDeepCognitiveErrors as gptRankDeepCognitiveErrors,
  type ErrorIndex,
} from "./gpt";
import type { DeepInternalContext } from "./gpt/deepContext";
import { generateDeepInternalContext } from "./gpt/deepContext";
import type { DeepAutoThoughtResult } from "./gpt/deepThought";

export type ExtendedAutomaticThought = {
  category: string;
  belief: string;
  emotionReason: string;
};

export type ExtendedAutomaticThoughtsResult = {
  sdtThoughts: ExtendedAutomaticThought[];
};

export type CognitiveErrorItem = {
  title: string;
  description: string;
  userQuote: string;
  analysis: string;
};

export type CognitiveErrorAnalysisResult = {
  errors: CognitiveErrorItem[];
};

export type CognitiveErrorRankItem = {
  index: ErrorIndex;
  reason: string;
  evidenceQuote?: string;
};

export type CognitiveErrorRankResult = {
  ranked: CognitiveErrorRankItem[];
};

export type CognitiveErrorDetailItem = {
  index: ErrorIndex;
  analysis: string;
};

export type CognitiveErrorDetailResult = {
  errors: CognitiveErrorDetailItem[];
};

// 메타 export (UI에서 사용)
export { COGNITIVE_ERRORS, COGNITIVE_ERRORS_BY_ID, COGNITIVE_ERRORS_BY_INDEX };
export type { ErrorIndex };

export type BurnsEmpathyResult = {
  thoughtEmpathy: string;
  emotionEmpathy: string;
  iStatement: string;
  soothing: string;
  observedSelf: string;
};

export type AlternativeThoughtItem = {
  thought: string;
  technique: string;
  techniqueDescription: string;
};

export type BibleVerseResult = {
  book: string;
  chapter: number | null;
  startVerse: number | null;
  endVerse: number | null;
  verse: string;
  prayer: string;
};

export type BehaviorSuggestionItem = {
  behaviorId: CognitiveBehaviorId;
  suggestion: string;
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

// 1) 확장 자동사고
export async function generateExtendedAutomaticThoughts(
  situation: string,
  emotion: string,
  options?: { noteProposal?: boolean },
): Promise<ExtendedAutomaticThoughtsResult> {
  return gptGenerateExtendedAutomaticThoughts(situation, emotion, options);
}

// 2.a) 인지오류 랭킹(10개 유력순)
export async function rankCognitiveErrors(
  situation: string,
  thought: string,
): Promise<CognitiveErrorRankResult> {
  return gptRankCognitiveErrors(situation, thought);
}

// 2.b) 인지오류 상세(후보 index만)
export async function analyzeCognitiveErrorDetails(
  situation: string,
  thought: string,
  candidates: ErrorIndex[],
  options?: { noteProposal?: boolean },
): Promise<CognitiveErrorDetailResult> {
  return gptAnalyzeCognitiveErrorDetails(
    situation,
    thought,
    candidates,
    options,
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

export async function generateDeepAutoThoughts(
  situation: string,
  emotion: string,
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
  internal: DeepInternalContext,
): Promise<DeepAutoThoughtResult> {
  return gptGenerateDeepSdtAutomaticThoughts(
    situation,
    emotion,
    main,
    subs,
    internal,
  );
}

export async function rankDeepCognitiveErrors(
  situation: string,
  thought: string,
) {
  return gptRankDeepCognitiveErrors(situation, thought);
}

export async function analyzeDeepCognitiveErrorDetails(
  situation: string,
  thought: string,
  internal: DeepInternalContext,
  candidates: ErrorIndex[],
) {
  return gptAnalyzeDeepCognitiveErrorDetails(
    situation,
    thought,
    internal,
    candidates,
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

// 4) 성경구절
export async function generateBibleVerse(
  situation: string,
  emotion: string,
): Promise<BibleVerseResult> {
  return gptGenerateBibleVerse(situation, emotion);
}

// 5) 번즈 공감
export async function generateBurnsEmpathy(
  situation: string,
  emotion: string,
  thought: string,
  intensity: number | null,
): Promise<BurnsEmpathyResult> {
  return gptGenerateBurnsEmpathy(situation, emotion, thought, intensity);
}

// 6) 행동 제안
export async function generateBehaviorSuggestions(
  situation: string,
  emotionThoughtPairs: Array<{
    emotion: string;
    intensity: number | null;
    thought: string;
  }>,
  selectedAlternativeThought: string,
  cognitiveErrors: Array<{ title: string; detail?: string }>,
  behaviors: Array<{
    id: CognitiveBehaviorId;
    replacement_title: string;
    category: string;
    description: string;
    usage_description: string;
  }>,
  options?: { noteProposal?: boolean },
): Promise<BehaviorSuggestionItem[]> {
  return gptGenerateBehaviorSuggestions(
    situation,
    emotionThoughtPairs,
    selectedAlternativeThought,
    cognitiveErrors,
    behaviors,
    options,
  );
}
