// src/constants/behaviors.ts
export const COGNITIVE_BEHAVIORS_CATEGORY_ENUM = {
  SELF_COMPASSION: "자기 자비",
  MOTIVATION: "동기부여",
  REALITY_REVIEW: "현실 직시",
  FACT_CHECK: "팩트 체크",
  LANGUAGE_TONE: "언어 순화",
  RESPONSIBILITY_SHARING: "책임 분산",
} as const;

export type CognitiveBehaviorsCategory =
  (typeof COGNITIVE_BEHAVIORS_CATEGORY_ENUM)[keyof typeof COGNITIVE_BEHAVIORS_CATEGORY_ENUM];

export const COGNITIVE_BEHAVIOR_ID = {
  DOUBLE_STANDARD: "DOUBLE_STANDARD",
  COST_BENEFIT: "COST_BENEFIT",
  BE_SPECIFIC: "BE_SPECIFIC",
  EXAMINE_EVIDENCE: "EXAMINE_EVIDENCE",
  SEMANTIC_METHOD: "SEMANTIC_METHOD",
  RE_ATTRIBUTION: "RE_ATTRIBUTION",
} as const;

export type CognitiveBehaviorId =
  (typeof COGNITIVE_BEHAVIOR_ID)[keyof typeof COGNITIVE_BEHAVIOR_ID];

export const COGNITIVE_BEHAVIORS = [
  {
    id: COGNITIVE_BEHAVIOR_ID.DOUBLE_STANDARD,
    title: "이중 기준 기법 (Double Standard)",
    replacement_title: "친구에게 말하듯 설명하기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.SELF_COMPASSION,
    description: "남에게는 관대하고 자신에게는 혹독한 이중 잣대를 버립니다.",
    usage_description:
      "친한 친구가 나와 똑같은 상황일 때 내가 해줄 위로의 말을 상상하여, 그 말을 거울을 보듯 자신에게 똑같이 해줍니다.",
  },
  {
    id: COGNITIVE_BEHAVIOR_ID.COST_BENEFIT,
    title: "비용 편익 분석 (Cost-Benefit Analysis)",
    replacement_title: "득과 실 계산하기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.MOTIVATION,
    description:
      "변화하고 싶지만 변화하기 싫은 양가감정(저항)을 다룹니다.",
    usage_description:
      "부정적인 생각이나 습관을 유지했을 때의 '장점'과 '단점'을 각각 적어보고, 변화하는 것이 정말 나에게 이득인지 논리적으로 판단합니다.",
  },
  {
    id: COGNITIVE_BEHAVIOR_ID.BE_SPECIFIC,
    title: "구체적으로 생각하기 (Be Specific)",
    replacement_title: "추상적 비난 멈추기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.REALITY_REVIEW,
    description:
      '모호한 두려움("내 인생은 끝났어")을 구체적인 사실로 쪼갭니다.',
    usage_description:
      '거창한 비난을 멈추고 "나는 이번 시험에서 70점을 받았다"처럼 평가가 빠진 건조한 \'사실(Fact)\'만을 다시 적습니다.',
  },
  {
    id: COGNITIVE_BEHAVIOR_ID.EXAMINE_EVIDENCE,
    title: "증거 조사 (Examine the Evidence)",
    replacement_title: "진실 검증하기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.FACT_CHECK,
    description:
      "부정적인 생각이 사실인지 법정의 판사처럼 증거를 따져봅니다.",
    usage_description:
      "내 생각을 뒷받침하는 '지지 증거'와 반박하는 '반대 증거'를 모두 찾아 적은 뒤, 이 생각이 100% 진실인지 판결을 내립니다.",
  },
  {
    id: COGNITIVE_BEHAVIOR_ID.SEMANTIC_METHOD,
    title: "의미론적 방법 (Semantic Method)",
    replacement_title: "말투 고쳐쓰기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.LANGUAGE_TONE,
    description:
      "감정을 자극하는 과격한 언어를 덜 파괴적인 언어로 바꿉니다.",
    usage_description:
      '"반드시 ~해야 해", "끔찍해" 같은 단어를 찾아 "~하면 좋겠다", "좀 불편하다" 정도로 부드럽게 고쳐서 다시 말해봅니다.',
  },
  {
    id: COGNITIVE_BEHAVIOR_ID.RE_ATTRIBUTION,
    title: "재귀인 (Re-attribution)",
    replacement_title: "원인 객관화하기",
    category: COGNITIVE_BEHAVIORS_CATEGORY_ENUM.RESPONSIBILITY_SHARING,
    description:
      "모든 문제가 '내 탓'이라는 착각에서 벗어나 원인을 나눕니다.",
    usage_description:
      "사건의 원인을 피자 조각 나누듯 '나의 실수', '타인의 잘못', '운', '상황' 등으로 나누어 내 책임의 비율을 객관적으로 조정합니다.",
  },
] as const satisfies ReadonlyArray<{
  id: CognitiveBehaviorId;
  title: string;
  replacement_title: string;
  category: CognitiveBehaviorsCategory;
  description: string;
  usage_description: string;
}>;
