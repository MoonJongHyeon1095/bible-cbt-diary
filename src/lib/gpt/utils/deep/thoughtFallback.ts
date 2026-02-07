import type { SDTKey } from "../../deepThought.types";

export type ThoughtItem = {
  belief: [string, string, string];
  emotion_reason: string;
};

export const FALLBACK: Record<SDTKey, ThoughtItem> = {
  relatedness: {
    belief: [
      "나는 내 마음을 드러내면 상대가 나를 부담스러워할 거라고 느낀다.",
      "그래서 상대가 나를 멀리할 거라고 믿는다.",
      "그러면 결국 나는 이해받지 못하고 더 멀어질 것 같아 두렵다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  competence: {
    belief: [
      "나는 기대를 충족하지 못하면 곧바로 무가치해질 것 같다고 믿는다.",
      "내 가치는 내가 성취하는 것으로만 결정된다고 생각한다.",
      "그래서 작은 흔들림도 실패로 이어질 것 같아 불안해진다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
  autonomy: {
    belief: [
      "나는 상황이 내 의지와 상관없이 흘러가고 있다고 느낀다.",
      "그래서 내가 선택할 여지가 거의 없다고 생각한다.",
      "그래서 결국 나는 끌려다니며 더 나빠질 것 같아 답답하다.",
    ],
    emotion_reason: "그래서 지금 감정이 더 크게 느껴진다.",
  },
};
