import { markAiFallback } from "@/lib/utils/aiFallback";

export type ErrorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * ✅ 2.a: 랭킹 결과(10개 유력순)
 */
export type CognitiveErrorRankResult = {
  ranked: Array<{
    index: ErrorIndex; // 1..10
    reason: string; // 1~2문장
    evidenceQuote?: string; // 원문 그대로 인용(가능하면)
  }>;
};

export const FALLBACK_INDICES: ErrorIndex[] = [1, 5, 7];

export function isValidIndex(n: unknown): n is ErrorIndex {
  return Number.isInteger(n) && typeof n === "number" && n >= 1 && n <= 10;
}

export function defaultRank(): CognitiveErrorRankResult {
  return markAiFallback({
    ranked: ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as ErrorIndex[]).map((idx) => ({
      index: idx,
      reason:
        "입력 정보가 제한적이라 우선순위 판단이 어려워 기본 순서로 정리했습니다.",
    })),
  });
}
