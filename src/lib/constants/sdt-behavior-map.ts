import { SDT_KEY, type SdtKey } from "./sdt";

export const SDT_BEHAVIOR_ID = {
  CHOICE_MAPPING: "CHOICE_MAPPING",
  VALUE_ALIGNMENT_CHECK: "VALUE_ALIGNMENT_CHECK",
  ACTIVE_CONSTRUCTIVE_RESPONDING: "ACTIVE_CONSTRUCTIVE_RESPONDING",
  GRATITUDE_EXPRESSION: "GRATITUDE_EXPRESSION",
  ACTS_OF_KINDNESS: "ACTS_OF_KINDNESS",
  MASTERY_JOURNALING: "MASTERY_JOURNALING",
  STRENGTH_SPOTTING: "STRENGTH_SPOTTING",
} as const;

export type SdtBehaviorId =
  (typeof SDT_BEHAVIOR_ID)[keyof typeof SDT_BEHAVIOR_ID];

export type SdtBehavior = {
  id: SdtBehaviorId;
  behavior_label: string;
  description: string;
  action: string;
  advanced_action: string;
  evidence: string;
};

export const SDT_BEHAVIORS = [
  {
    id: SDT_BEHAVIOR_ID.CHOICE_MAPPING,
    behavior_label: "선택 지도 그리기 (Choice Mapping)",
    description:
      "이 감정이 어떤 자발적 선택에서 비롯되었는지 추적한다.",
    action:
      "이 감정을 느끼게 된 상황에서 '내가 직접 선택한 것'을 3가지 적어본다. 크든 작든 상관없다.",
    advanced_action:
      "이번 주에 비슷한 자율적 선택을 할 수 있는 새로운 영역을 하나 찾아 실행해본다.",
    evidence:
      "사람은 스스로 선택했다고 느낄 때 내재적 동기와 안녕감이 높아지고, 선택의 여지가 있을수록 몰입과 수행도 함께 좋아지는 경향이 있습니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.VALUE_ALIGNMENT_CHECK,
    behavior_label: "가치 정렬 확인 (Value Alignment Check)",
    description:
      "이 감정이 나의 핵심 가치와 얼마나 일치하는지 확인한다.",
    action:
      "이 감정이 나의 어떤 가치관(예: 자유, 성장, 정직, 창의성)과 연결되는지 적어본다.",
    advanced_action:
      "그 가치를 일상에서 더 자주 실현할 수 있는 작은 루틴 하나를 설계해본다. '~해야 한다'가 아니라 '~하기로 선택한다'로 표현해본다.",
    evidence:
      "자기 가치와 일치하는 목표는 욕구 충족과 안녕감을 높이고, 통제적 언어보다 스스로 선택하는 언어가 동기의 내면화를 돕습니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.ACTIVE_CONSTRUCTIVE_RESPONDING,
    behavior_label: "능동적 건설적 반응 (Active Constructive Responding)",
    description:
      "상대방의 좋은 소식에 적극적으로 관심을 보여 관계를 강화한다.",
    action:
      "오늘 이 감정과 관련된 사람에게 구체적으로 어떤 점이 고마웠는지, 또는 어떤 점이 좋았는지 전해본다.",
    advanced_action:
      "이번 주에 그 사람과 의미 있는 시간을 보낼 계획을 하나 세워본다. 함께 새로운 활동을 시도하면 더 좋다.",
    evidence:
      "상대의 좋은 일에 적극적이고 따뜻하게 반응하는 방식은 친밀감과 신뢰를 높이고, 함께 새로운 경험을 나누는 것은 관계 만족도를 높이는 데 도움이 됩니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.GRATITUDE_EXPRESSION,
    behavior_label: "감사 표현 실천 (Gratitude Expression)",
    description:
      "관계에서 비롯된 긍정 감정을 감사 표현으로 되돌려 준다.",
    action:
      "이 감정을 느끼게 해준 사람에게 감사한 이유를 3문장으로 적어본다. 가능하다면 직접 전달한다.",
    advanced_action:
      "한 달에 한 번, 감사 편지를 쓰고 직접 읽어주는 '감사 방문'을 실천해본다.",
    evidence:
      "감사 표현은 관계 안에서 서로의 가치를 확인하게 하고 유대감을 강화하며, 정기적인 감사 실천은 행복감을 높이는 데 도움이 됩니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.ACTS_OF_KINDNESS,
    behavior_label: "친절 행동 실천 (Acts of Kindness)",
    description:
      "의도적인 친절 행동으로 관계의 긍정적 순환을 만든다.",
    action:
      "오늘 누군가를 위해 할 수 있는 작은 친절 한 가지를 지금 바로 실행해본다.",
    advanced_action:
      "이번 주 하루를 '친절의 날'로 정하고, 그날 5가지 의도적 친절 행동을 수행해본다.",
    evidence:
      "의도적인 친절 행동은 긍정 정서와 관계 만족을 높이고, 친절을 한 번에 의식적으로 실천하는 방식은 행복감 증가와 연결되는 경향이 있습니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.MASTERY_JOURNALING,
    behavior_label: "숙달 기록 (Mastery Journaling)",
    description:
      "자신이 성장하고 있다는 증거를 구체적으로 기록한다.",
    action:
      "오늘 이 감정을 느끼게 한 '내가 해낸 일'을 구체적으로 적고, 3개월 전의 나와 비교해본다.",
    advanced_action:
      "다음 목표를 현재 수준보다 살짝 높게 설정하고, 달성 과정을 주간 단위로 기록해본다.",
    evidence:
      "도전과 기술의 균형이 맞을 때 몰입이 잘 일어나며, 현재 수준보다 약간 높은 목표를 점진적으로 설정하는 것이 지속적인 성장감에 도움이 됩니다.",
  },
  {
    id: SDT_BEHAVIOR_ID.STRENGTH_SPOTTING,
    behavior_label: "강점 발견 (Strength Spotting)",
    description:
      "이 성취에서 발휘된 자신의 고유한 강점을 식별한다.",
    action:
      "오늘 활용한 나만의 강점(예: 끈기, 창의성, 분석력, 공감)을 2가지 적어본다.",
    advanced_action:
      "대표 강점 5개를 파악하고, 이번 주에 의도적으로 활용해본다.",
    evidence:
      "자신의 대표 강점을 인식하고 일상에서 의도적으로 사용할수록 성취감과 활력이 높아지고, 긍정 정서를 더 오래 유지하는 데 도움이 됩니다.",
  },
] as const satisfies ReadonlyArray<SdtBehavior>;

export const SDT_BEHAVIORS_BY_ID = Object.fromEntries(
  SDT_BEHAVIORS.map((behavior) => [behavior.id, behavior]),
) as Record<SdtBehaviorId, SdtBehavior>;

export const SDT_RECOMMENDED_BEHAVIOR_IDS = {
  [SDT_KEY.AUTONOMY]: [
    SDT_BEHAVIOR_ID.CHOICE_MAPPING,
    SDT_BEHAVIOR_ID.VALUE_ALIGNMENT_CHECK,
  ],
  [SDT_KEY.RELATEDNESS]: [
    SDT_BEHAVIOR_ID.ACTIVE_CONSTRUCTIVE_RESPONDING,
    SDT_BEHAVIOR_ID.GRATITUDE_EXPRESSION,
    SDT_BEHAVIOR_ID.ACTS_OF_KINDNESS,
  ],
  [SDT_KEY.COMPETENCE]: [
    SDT_BEHAVIOR_ID.MASTERY_JOURNALING,
    SDT_BEHAVIOR_ID.STRENGTH_SPOTTING,
  ],
} as const satisfies Record<SdtKey, readonly SdtBehaviorId[]>;

export function getSdtRecommendedBehaviors(sdtKey: SdtKey) {
  return SDT_RECOMMENDED_BEHAVIOR_IDS[sdtKey].map(
    (behaviorId) => SDT_BEHAVIORS_BY_ID[behaviorId],
  );
}
