import type { ErrorIndex } from "./rankMeta";

export type CognitiveErrorDetailResult = {
  errors: Array<{
    index: ErrorIndex;
    analysis: string;
  }>;
};

export function fallbackCognitiveErrorDetail(
  candidates: ErrorIndex[],
): CognitiveErrorDetailResult {
  const make = (idx: ErrorIndex) => {
    if (idx === 1) {
      return "이 문장에서는 성공/실패처럼 두 극단으로 생각이 기울어져 있어요. 중간 가능성을 스스로 배제하면 감정이 더 커질 수 있어요. 지금 상황에서 ‘중간 단계의 가능성’이 하나라도 있는지, 구체적으로 무엇인지 확인해볼 수 있을까요?";
    }
    if (idx === 5) {
      return "이 문장에서는 확인되지 않은 가정이 빠르게 결론으로 굳어지는 흐름이 보여요. 근거가 부족한 채로 최악의 결과를 확정하면 감정이 더 커질 수 있어요. 실제로 확인된 사실과 아직 추정인 부분을 나눠보면, 지금은 어떤 것이 사실에 더 가까울까요?";
    }
    if (idx === 7) {
      return "이 문장에서는 지금의 느낌이 사실을 증명하는 것처럼 연결되는 지점이 있어요. ‘느껴지니까 사실’로 굳어지면 감정이 더 커질 수 있어요. 지금의 느낌을 뒷받침하는 ‘사실’은 무엇이고, 느낌만으로 채운 부분은 어디일까요?";
    }
    return "이 문장에서는 해석이 한 방향으로 빠르게 굳어지면서 다른 가능성이 줄어드는 흐름이 보여요. 이렇게 한 가지 해석만 남으면 감정이 더 커질 수 있어요. 지금 해석 말고, 조금 덜 아픈 해석이 하나라도 가능한지 확인해볼 수 있을까요?";
  };

  return {
    errors: candidates.map((idx) => ({
      index: idx,
      analysis: make(idx),
    })),
  };
}
