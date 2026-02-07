import { cleanText } from "../core/text";

// 내부 식별자(LLM 계약용)
export type TechniqueType = "REALITY_CHECK" | "STRENGTHS" | "SELF_ACCEPTANCE";

// ✅ 최종 반환 타입: technique에 "한글 라벨"이 들어가도록
export type AlternativeThought = {
  thought: string;
  technique: string; // "현실검증" | "강점 발견" | "자기수용"
  techniqueDescription: string;
};

export const TECHNIQUES: Array<{
  technique: TechniqueType; // 내부 enum
  label: string; // ✅ 한글 라벨
  techniqueDescription: string;
}> = [
  {
    technique: "REALITY_CHECK",
    label: "현실검증",
    techniqueDescription:
      "사실과 증거, 가능한 대안적 해석을 통해 극단적인 사고를 현실적으로 재평가합니다.",
  },
  {
    technique: "STRENGTHS",
    label: "강점 발견",
    techniqueDescription:
      "이미 해낸 것과 버텨온 경험에서 회복 자원과 자기 효능감을 찾습니다.",
  },
  {
    technique: "SELF_ACCEPTANCE",
    label: "자기수용",
    techniqueDescription:
      "완벽주의와 자기비난을 완화하고 지금의 자신을 존중하는 관점을 기릅니다.",
  },
];

export const TECHNIQUE_LABEL_MAP: Record<TechniqueType, string> = {
  REALITY_CHECK: "현실검증",
  STRENGTHS: "강점 발견",
  SELF_ACCEPTANCE: "자기수용",
};

export const DEFAULT_THOUGHTS: Record<TechniqueType, string> = {
  REALITY_CHECK:
    "지금 떠오르는 생각이 사실인지, 아니면 감정이 강해져서 한쪽으로 치우친 해석인지 차분히 구분해볼 필요가 있어요. 모든 상황에는 여러 가능성이 있는데, 지금은 가장 불리한 해석 하나만 붙잡고 있는 것 같아요. 증거와 반증을 함께 살펴보면 생각의 무게가 조금은 달라질 수 있어요.",
  STRENGTHS:
    "이 상황에 오기까지 이미 많은 것들을 감당하고 버텨왔다는 점은 분명해요. 쉽지 않은 조건에서도 계속 움직여 왔다는 사실 자체가 당신의 자원이에요. 지금은 그 강점이 잘 보이지 않지만, 사라진 건 아니에요.",
  SELF_ACCEPTANCE:
    "이렇게 힘들다고 느끼는 자신을 나약하다고 판단할 필요는 없어요. 누구라도 이 정도 상황에서는 흔들릴 수 있어요. 지금의 모습도 충분히 존중받아야 할 나의 한 부분이에요.",
};

export function normalizeTechnique(v: unknown): TechniqueType | null {
  const t = cleanText(v);
  if (t === "REALITY_CHECK") return "REALITY_CHECK";
  if (t === "STRENGTHS") return "STRENGTHS";
  if (t === "SELF_ACCEPTANCE") return "SELF_ACCEPTANCE";
  return null;
}

export function toResultByTechnique(
  map: Partial<Record<TechniqueType, string>>,
): AlternativeThought[] {
  return TECHNIQUES.map((tech) => ({
    thought: map[tech.technique] ?? DEFAULT_THOUGHTS[tech.technique],
    technique: TECHNIQUE_LABEL_MAP[tech.technique],
    techniqueDescription: tech.techniqueDescription,
  }));
}
