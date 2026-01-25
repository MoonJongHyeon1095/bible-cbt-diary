// src/lib/ai.ts
// gpt
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERRORS_BY_ID,
  COGNITIVE_ERRORS_BY_INDEX,
} from "./constants/errors";
import {
  generateBehaviorSuggestions as gptGenerateBehaviorSuggestions,
  type ErrorIndex, // (호환) 기존 단일 호출
  analyzeCognitiveErrorDetails as gptAnalyzeCognitiveErrorDetails,
  analyzeDeepCognitiveErrorDetails as gptAnalyzeDeepCognitiveErrorDetails,
  generateDeepAlternativeThoughts as gptGenerateDeepAlternativeThoughts,
  generateDeepAutoThoughtAndSummary as gptGenerateDeepAutoThoughtAndSummary,
  generateBibleVerse as gptGenerateBibleVerse,
  generateBurnsEmpathy as gptGenerateBurnsEmpathy,
  generateContextualAlternativeThoughts as gptGenerateContextualAlternativeThoughts,
  generateExtendedAutomaticThoughts as gptGenerateExtendedAutomaticThoughts,
  rankDeepCognitiveErrors as gptRankDeepCognitiveErrors,
  rankCognitiveErrors as gptRankCognitiveErrors
} from "./gpt";
import type { CognitiveBehaviorId } from "./constants/behaviors";

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

export type DeepThoughtResult = {
  autoThought: string;
  summary: string;
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

// 1) 확장 자동사고
export async function generateExtendedAutomaticThoughts(
  situation: string,
  emotion: string
): Promise<ExtendedAutomaticThoughtsResult> {
  return gptGenerateExtendedAutomaticThoughts(situation, emotion);
}

// 2.a) 인지오류 랭킹(10개 유력순)
export async function rankCognitiveErrors(
  situation: string,
  thought: string
): Promise<CognitiveErrorRankResult> {
  return gptRankCognitiveErrors(situation, thought);
}

// 2.b) 인지오류 상세(후보 index만)
export async function analyzeCognitiveErrorDetails(
  situation: string,
  thought: string,
  candidates: ErrorIndex[]
): Promise<CognitiveErrorDetailResult> {
  return gptAnalyzeCognitiveErrorDetails(situation, thought, candidates);
}

// 3) 대안사고
export async function generateContextualAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  cognitiveErrors: Array<string | { title: string; detail?: string }>
): Promise<AlternativeThoughtItem[]> {
  return gptGenerateContextualAlternativeThoughts(
    situation,
    emotion,
    thought,
    cognitiveErrors
  );
}

export async function generateDeepAutoThoughtAndSummary(
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
): Promise<DeepThoughtResult> {
  return gptGenerateDeepAutoThoughtAndSummary(situation, emotion, main, subs);
}

export async function rankDeepCognitiveErrors(
  situation: string,
  thought: string,
  summary: string,
) {
  return gptRankDeepCognitiveErrors(situation, thought, summary);
}

export async function analyzeDeepCognitiveErrorDetails(
  situation: string,
  thought: string,
  summary: string,
  candidates: ErrorIndex[],
) {
  return gptAnalyzeDeepCognitiveErrorDetails(
    situation,
    thought,
    summary,
    candidates,
  );
}

export async function generateDeepAlternativeThoughts(
  situation: string,
  emotion: string,
  thought: string,
  summary: string,
  cognitiveErrors: Array<string | { title: string; detail?: string }>,
  previousAlternatives: string[],
): Promise<AlternativeThoughtItem[]> {
  return gptGenerateDeepAlternativeThoughts(
    situation,
    emotion,
    thought,
    summary,
    cognitiveErrors,
    previousAlternatives,
  );
}

// 4) 성경구절
export async function generateBibleVerse(
  situation: string,
  emotion: string
): Promise<BibleVerseResult> {
  return gptGenerateBibleVerse(situation, emotion);
}

// 5) 번즈 공감
export async function generateBurnsEmpathy(
  situation: string,
  emotion: string,
  thought: string,
  intensity: number | null
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
  }>
): Promise<BehaviorSuggestionItem[]> {
  return gptGenerateBehaviorSuggestions(
    situation,
    emotionThoughtPairs,
    selectedAlternativeThought,
    cognitiveErrors,
    behaviors
  );
}
