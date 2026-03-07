export const SDT_KEY = {
  AUTONOMY: "autonomy",
  RELATEDNESS: "relatedness",
  COMPETENCE: "competence",
} as const;

export type SdtKey = (typeof SDT_KEY)[keyof typeof SDT_KEY];

export type SdtNeed = {
  key: SdtKey;
  label: string;
  summary: string;
  description: string;
};

export const SDT_NEEDS: SdtNeed[] = [
  {
    key: SDT_KEY.AUTONOMY,
    label: "자율성",
    summary: "내가 스스로 선택하고 결정했기 때문",
    description:
      "스스로 선택하고 결정했다는 느낌, 자기 삶의 주인이라는 감각. 사용자가 느낀 감정의 가장 큰 원인은 스스로 유의미한 결정을 내렸기 때문.",
  },
  {
    key: SDT_KEY.RELATEDNESS,
    label: "관계성",
    summary: "누군가와 연결되고 소속감을 느꼈기 때문",
    description:
      "타인과 연결되고 소속감을 느끼는 것, 누군가에게 중요한 존재라는 감각. 사용자가 느낀 감정의 가장 큰 원인은 좋은 관계에서 소속감과 의미를 경험했기 때문.",
  },
  {
    key: SDT_KEY.COMPETENCE,
    label: "유능감",
    summary: "내 능력을 발휘하고 성장했기 때문",
    description:
      "능력을 발휘하고 성장했다는 느낌, 도전을 극복했다는 감각. 사용자가 느낀 감정의 가장 큰 원인은 도전을 통해 유의미한 결과를 얻었기 때문.",
  },
];

export const SDT_NEEDS_BY_KEY = Object.fromEntries(
  SDT_NEEDS.map((need) => [need.key, need]),
) as Record<SdtKey, SdtNeed>;
