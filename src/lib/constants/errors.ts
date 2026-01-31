// src/constants/errors.ts
export const COGNITIVE_ERROR_ID = {
  ALL_OR_NOTHING: "ALL_OR_NOTHING",
  OVERGENERALIZATION: "OVERGENERALIZATION",
  MENTAL_FILTER: "MENTAL_FILTER",
  DISCOUNTING_POSITIVE: "DISCOUNTING_POSITIVE",
  JUMPING_TO_CONCLUSIONS: "JUMPING_TO_CONCLUSIONS",
  MAGNIFICATION_MINIMIZATION: "MAGNIFICATION_MINIMIZATION",
  EMOTIONAL_REASONING: "EMOTIONAL_REASONING",
  SHOULD_STATEMENTS: "SHOULD_STATEMENTS",
  LABELING: "LABELING",
  PERSONALIZATION: "PERSONALIZATION",
} as const;

export type CognitiveErrorId =
  (typeof COGNITIVE_ERROR_ID)[keyof typeof COGNITIVE_ERROR_ID];

export type CognitiveErrorIndex =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export const COGNITIVE_ERRORS = [
  {
    index: 1,
    id: COGNITIVE_ERROR_ID.ALL_OR_NOTHING,
    title: "전부 아니면 전무 사고",
    description:
      "흑백논리, 극단적 사고. 중간 지대 없이 완전한 성공 아니면 완전한 실패로만 생각합니다.",
  },
  {
    index: 2,
    id: COGNITIVE_ERROR_ID.OVERGENERALIZATION,
    title: "과잉일반화",
    description:
      '한 번의 경험을 모든 것에 적용. 한 번의 부정적 사건을 "항상", "절대" 같은 표현으로 일반화합니다.',
  },
  {
    index: 3,
    id: COGNITIVE_ERROR_ID.MENTAL_FILTER,
    title: "정신적 여과",
    description:
      "부정적인 것만 보고 긍정적인 것 무시. 좋은 일들은 걸러내고 나쁜 일만 집중합니다.",
  },
  {
    index: 4,
    id: COGNITIVE_ERROR_ID.DISCOUNTING_POSITIVE,
    title: "긍정 무시",
    description:
      '좋은 일을 평가절하. 긍정적 경험을 "별거 아니야", "운이 좋았을 뿐"이라고 폄하합니다.',
  },
  {
    index: 5,
    id: COGNITIVE_ERROR_ID.JUMPING_TO_CONCLUSIONS,
    title: "성급한 결론",
    description: "근거 없이 부정적으로 해석. 증거 없이 나쁜 결과를 확신합니다.",
  },
  {
    index: 6,
    id: COGNITIVE_ERROR_ID.MAGNIFICATION_MINIMIZATION,
    title: "확대와 축소",
    description: "문제를 과장하거나 장점을 축소. 실수는 크게, 성공은 작게 봅니다.",
  },
  {
    index: 7,
    id: COGNITIVE_ERROR_ID.EMOTIONAL_REASONING,
    title: "감정적 추론",
    description:
      '감정이 사실이라고 믿음. "이런 기분이 드니까 사실일 거야"라고 생각합니다.',
  },
  {
    index: 8,
    id: COGNITIVE_ERROR_ID.SHOULD_STATEMENTS,
    title: "당위적 진술",
    description:
      '~해야 한다는 경직된 규칙. "반드시", "꼭", "절대" 같은 경직된 기준을 적용합니다.',
  },
  {
    index: 9,
    id: COGNITIVE_ERROR_ID.LABELING,
    title: "이름 붙이기",
    description:
      '자신이나 타인에게 부정적 꼬리표. "나는 실패자야", "저 사람은 이기적이야"라고 단정합니다.',
  },
  {
    index: 10,
    id: COGNITIVE_ERROR_ID.PERSONALIZATION,
    title: "개인화",
    description:
      "모든 것을 자신 탓으로 돌림. 자신이 통제할 수 없는 일도 자기 책임으로 여깁니다.",
  },
] as const satisfies ReadonlyArray<{
  index: CognitiveErrorIndex;
  id: CognitiveErrorId;
  title: string;
  description: string;
}>;

export const COGNITIVE_ERRORS_EN = [
  {
    index: 1,
    id: COGNITIVE_ERROR_ID.ALL_OR_NOTHING,
    title: "All-or-nothing thinking",
    description:
      "Black-and-white, extreme thinking. With no middle ground, everything is either complete success or complete failure.",
  },
  {
    index: 2,
    id: COGNITIVE_ERROR_ID.OVERGENERALIZATION,
    title: "Overgeneralization",
    description:
      "Applying one experience to everything. A single negative event is generalized with words like \"always\" or \"never\".",
  },
  {
    index: 3,
    id: COGNITIVE_ERROR_ID.MENTAL_FILTER,
    title: "Mental filter",
    description:
      "Seeing only the negative and ignoring the positive. Filtering out good things and focusing only on the bad.",
  },
  {
    index: 4,
    id: COGNITIVE_ERROR_ID.DISCOUNTING_POSITIVE,
    title: "Disqualifying the positive",
    description:
      "Discounting positive experiences as \"no big deal\" or \"just luck\".",
  },
  {
    index: 5,
    id: COGNITIVE_ERROR_ID.JUMPING_TO_CONCLUSIONS,
    title: "Jumping to conclusions",
    description:
      "Interpreting negatively without evidence. Assuming a bad outcome with little or no proof.",
  },
  {
    index: 6,
    id: COGNITIVE_ERROR_ID.MAGNIFICATION_MINIMIZATION,
    title: "Magnification and minimization",
    description:
      "Exaggerating problems or downplaying strengths. Seeing mistakes as big and successes as small.",
  },
  {
    index: 7,
    id: COGNITIVE_ERROR_ID.EMOTIONAL_REASONING,
    title: "Emotional reasoning",
    description:
      "Believing feelings are facts. Thinking \"because I feel this, it must be true\".",
  },
  {
    index: 8,
    id: COGNITIVE_ERROR_ID.SHOULD_STATEMENTS,
    title: "Should statements",
    description:
      "Rigid rules about how things should be. Applying strict standards like \"must\", \"should\", or \"always\".",
  },
  {
    index: 9,
    id: COGNITIVE_ERROR_ID.LABELING,
    title: "Labeling",
    description:
      "Attaching negative labels to yourself or others, like \"I'm a failure\" or \"That person is selfish\".",
  },
  {
    index: 10,
    id: COGNITIVE_ERROR_ID.PERSONALIZATION,
    title: "Personalization",
    description:
      "Blaming yourself for everything, even for things outside your control.",
  },
] as const satisfies ReadonlyArray<{
  index: CognitiveErrorIndex;
  id: CognitiveErrorId;
  title: string;
  description: string;
}>;

export const COGNITIVE_ERRORS_BY_INDEX = Object.fromEntries(
  COGNITIVE_ERRORS.map((error) => [error.index, error])
) as Record<CognitiveErrorIndex, (typeof COGNITIVE_ERRORS)[number]>;

export const COGNITIVE_ERRORS_BY_ID = Object.fromEntries(
  COGNITIVE_ERRORS.map((error) => [error.id, error])
) as Record<CognitiveErrorId, (typeof COGNITIVE_ERRORS)[number]>;
