import { NEGATIVE_EMOTIONS } from "./negative-emotions";
import { POSITIVE_EMOTIONS } from "./positive-emotions";

export type EmotionOption = {
  id: string;
  label: string;
  description: string;
  physical: string;
  color: string;
  positive: string[];
  caution: string[];
};

export type EmotionMood = "positive" | "negative";

export { NEGATIVE_EMOTIONS, POSITIVE_EMOTIONS };

export const EMOTIONS = NEGATIVE_EMOTIONS;
export const ALL_EMOTIONS: EmotionOption[] = [
  ...NEGATIVE_EMOTIONS,
  ...POSITIVE_EMOTIONS,
];

const EMOTIONS_BY_MOOD: Record<EmotionMood, EmotionOption[]> = {
  negative: NEGATIVE_EMOTIONS,
  positive: POSITIVE_EMOTIONS,
};

const EMOTION_BY_ID = Object.fromEntries(
  ALL_EMOTIONS.map((emotion) => [emotion.id, emotion]),
) as Record<string, EmotionOption>;

const EMOTION_BY_LABEL = Object.fromEntries(
  ALL_EMOTIONS.map((emotion) => [emotion.label, emotion]),
) as Record<string, EmotionOption>;

export function getEmotionsByMood(mood: EmotionMood | null | undefined) {
  return mood === "positive" ? POSITIVE_EMOTIONS : NEGATIVE_EMOTIONS;
}

export function findEmotionById(id: string) {
  return EMOTION_BY_ID[id];
}

export function findEmotionByLabel(label: string) {
  return EMOTION_BY_LABEL[label];
}

export function mapEmotionIdsToLabels(ids: readonly string[]) {
  return ids
    .map((id) => findEmotionById(id)?.label ?? "")
    .filter((label) => label.length > 0);
}

export function mapEmotionLabelsToIds(labels: readonly string[]) {
  return labels
    .map((label) => findEmotionByLabel(label)?.id ?? "")
    .filter((id) => id.length > 0);
}

export function getMoodTypeFromEmotionLabel(label: string): EmotionMood | null {
  if (!label) return null;
  if (POSITIVE_EMOTIONS.some((emotion) => emotion.label === label)) {
    return "positive";
  }
  if (NEGATIVE_EMOTIONS.some((emotion) => emotion.label === label)) {
    return "negative";
  }
  return null;
}

export function getMoodTypeFromEmotionId(id: string): EmotionMood | null {
  const emotion = findEmotionById(id);
  if (!emotion) return null;
  return getMoodTypeFromEmotionLabel(emotion.label);
}

export function filterEmotionLabelsByMood(
  labels: readonly string[],
  mood: EmotionMood,
) {
  const allowedLabels = new Set(
    EMOTIONS_BY_MOOD[mood].map((emotion) => emotion.label),
  );
  return labels.filter((label) => allowedLabels.has(label));
}

export function filterEmotionIdsByMood(ids: readonly string[], mood: EmotionMood) {
  const allowedIds = new Set(EMOTIONS_BY_MOOD[mood].map((emotion) => emotion.id));
  return ids.filter((id) => allowedIds.has(id));
}

export function formatEmotionLabels(labels: readonly string[]) {
  return labels.join(", ");
}

export function formatEmotionIds(ids: readonly string[]) {
  return formatEmotionLabels(mapEmotionIdsToLabels(ids));
}

export const EMOTION_BENEFITS: { [key: string]: string[] } = {
  슬픔: [
    "내가 무엇을 소중히 여기는지 깨닫게 해줍니다",
    "타인의 아픔에 공감하고 위로할 수 있는 능력을 키워줍니다",
    "인생에서 정말 중요한 것이 무엇인지 재평가하게 합니다",
    "다른 사람들이 내게 다가와 위로를 나눌 수 있는 기회가 됩니다",
    "감정을 표현하고 눈물로 해소하는 것은 신체적 스트레스를 줄여줍니다",
    "상실을 인정하고 받아들이는 과정을 통해 성장할 수 있습니다",
  ],
  분노: [
    "나의 경계선이 침범당했음을 알려주는 중요한 신호입니다",
    "불공정한 상황을 바로잡으려는 강력한 동기를 제공합니다",
    "나 자신과 소중한 사람을 지키기 위한 에너지를 줍니다",
    "문제 상황을 명확히 인식하고 행동하게 만듭니다",
    "정의감과 공정함에 대한 민감성이 있다는 증거입니다",
    "적절히 표현하면 관계에서 솔직한 대화의 계기가 됩니다",
  ],
  두려움: [
    "위험을 미리 감지하여 나를 보호합니다",
    "준비를 철저히 하게 만들어 성공 확률을 높입니다",
    "신중하게 행동하여 무모한 실수를 방지합니다",
    "중요한 상황에 집중력을 높여줍니다",
    "생존 본능으로서 인간의 자연스러운 반응입니다",
    "안전과 보호에 대한 건강한 관심을 가지고 있다는 의미입니다",
  ],
  혐오: [
    "나에게 해로운 것을 직관적으로 구별합니다",
    "건강한 경계를 설정하고 유지하는 데 도움을 줍니다",
    "독성 있는 관계나 환경에서 벗어나게 합니다",
    "자기 가치를 지키고 존중받을 권리를 주장하게 만듭니다",
    "윤리적 기준과 가치관이 명확하다는 증거입니다",
  ],
  수치심: [
    "타인과의 관계에서 품위를 지키려는 의식이 있습니다",
    "사회적 규범과 예의를 존중하는 태도를 가지고 있습니다",
    "자신을 성찰하고 개선하려는 동기가 됩니다",
    "타인의 시선을 의식하는 것은 사회적 존재로서 자연스러운 반응입니다",
    "윤리적 경계와 도덕적 기준이 있다는 의미입니다",
  ],
  죄책감: [
    "타인에게 피해를 주었음을 인식하는 양심이 있습니다",
    "잘못을 바로잡으려는 책임감을 불러일으킵니다",
    "사과하고 관계를 회복할 수 있는 계기가 됩니다",
    "앞으로 같은 실수를 반복하지 않도록 배우게 합니다",
    "타인을 배려하는 도덕적 감수성이 있다는 증거입니다",
    "진심 어린 반성은 인격적 성장의 기회입니다",
  ],
  외로움: [
    "사람과의 연결이 필요함을 알려주는 신호입니다",
    "친밀한 관계를 추구하고 노력하게 만드는 동기입니다",
    "자신을 돌아보고 내면을 탐색할 수 있는 시간이 됩니다",
    "진정한 관계의 소중함을 깨닫게 합니다",
    "혼자 있는 시간에 자기 이해와 성찰이 깊어집니다",
  ],
  절망: [
    "현재 상황이 매우 힘들다는 것을 정직하게 인식합니다",
    "변화가 절실히 필요하다는 것을 깨닫게 합니다",
    "삶의 바닥을 경험한 후 더 단단해질 수 있습니다",
    "도움을 요청하고 받아들일 수 있는 계기가 됩니다",
    "더 이상 나빠질 수 없다는 것은 오르기만 하면 된다는 의미입니다",
  ],
  답답함: [
    "현재 막힌 상황을 해결하려는 의지가 있습니다",
    "돌파구를 찾으려는 창의적 에너지의 원천입니다",
    "현상 유지에 만족하지 않고 발전을 추구합니다",
    "문제를 인식하고 있다는 것 자체가 해결의 첫걸음입니다",
    "포기하지 않는 끈기와 인내심을 키워줍니다",
  ],
  불안: [
    "미래의 위험을 예상하고 대비할 수 있게 합니다",
    "중요한 일에 신중하고 준비된 자세를 가지게 합니다",
    "완벽을 추구하고 실수를 최소화하려는 동기가 됩니다",
    "예민함은 세밀한 부분까지 인식하는 능력입니다",
    "걱정은 당신이 소중히 여기는 것이 있다는 증거입니다",
  ],
  짜증: [
    "작은 불편함을 민감하게 인식하는 능력이 있습니다",
    "개선이 필요한 부분을 빠르게 파악합니다",
    "나의 에너지 한계를 알려주는 신호입니다",
    "휴식과 재충전이 필요하다는 신체의 메시지입니다",
    "자신의 욕구와 필요를 존중하게 만듭니다",
  ],
};

export const EMOTION_WARNINGS: { [key: string]: string[] } = {
  슬픔: [
    "너무 오래 지속되면 우울증으로 발전할 수 있습니다",
    "일상 활동에 대한 의욕을 잃게 만들 수 있습니다",
    "사회적으로 고립되고 관계가 단절될 수 있습니다",
    "자기 돌봄을 소홀히 하고 건강이 악화될 수 있습니다",
    "부정적 생각이 반복되어 악순환에 빠질 수 있습니다",
  ],
  분노: [
    "충동적으로 행동하여 소중한 관계를 파괴할 수 있습니다",
    "신체 건강에 악영향을 미쳐 심혈관 문제를 일으킬 수 있습니다",
    "이성적 판단력이 흐려져 후회할 결정을 내릴 수 있습니다",
    "주변 사람들이 두려워하고 멀어지게 만듭니다",
    "습관화되면 사소한 일에도 과민 반응하게 됩니다",
  ],
  두려움: [
    "과도한 회피로 인해 기회를 놓치고 성장이 멈출 수 있습니다",
    "도전을 피하게 되어 삶의 범위가 좁아집니다",
    "안전지대에만 머물러 잠재력을 발휘하지 못합니다",
    "불안 장애나 공황 증상으로 발전할 수 있습니다",
    "지나친 걱정으로 현재를 즐기지 못하게 됩니다",
  ],
  혐오: [
    "편견과 차별로 이어져 관계를 단절시킬 수 있습니다",
    "새로운 경험과 다양성을 받아들이지 못하게 됩니다",
    "지나치게 비판적이 되어 타인을 상처 입힙니다",
    "자신도 혐오의 대상이 될까 두려워 위축될 수 있습니다",
    "완벽주의와 결합하여 자신에게도 가혹해질 수 있습니다",
  ],
  수치심: [
    "자존감이 무너지고 자신을 가치 없다고 느끼게 됩니다",
    "사회적 상황을 회피하고 고립될 수 있습니다",
    "자기 표현을 억제하고 진정한 자신을 숨기게 됩니다",
    "우울증과 불안 장애로 이어질 수 있습니다",
    "다른 사람의 시선에 과도하게 민감해집니다",
  ],
  죄책감: [
    "과도한 자책으로 자존감이 무너질 수 있습니다",
    "이미 지나간 일에 집착하여 현재를 살지 못합니다",
    "필요 이상으로 자신을 희생하고 타인을 우선시하게 됩니다",
    "죄책감을 이용당하고 조종당할 수 있습니다",
    "우울증으로 발전하여 일상 기능이 저하될 수 있습니다",
  ],
  외로움: [
    "고립감이 심화되어 우울과 무기력에 빠질 수 있습니다",
    "절망적인 관계에 매달리게 만들 수 있습니다",
    "자신을 부정적으로 평가하고 자존감이 낮아집니다",
    "사회적 불안이 커져서 더욱 관계 맺기가 어려워집니다",
    "만성화되면 신체 건강에도 악영향을 미칩니다",
  ],
  절망: [
    "희망을 완전히 잃고 삶을 포기하게 될 위험이 있습니다",
    "극단적인 생각과 행동으로 이어질 수 있습니다",
    "무기력감이 심화되어 아무것도 시도하지 않게 됩니다",
    "주변의 도움과 지지를 거부하게 만듭니다",
    "신체적 건강이 급격히 악화될 수 있습니다",
  ],
  답답함: [
    "초조함과 조급함으로 성급한 결정을 내릴 수 있습니다",
    "인내심을 잃고 쉽게 포기하게 만들 수 있습니다",
    "타인에게 짜증을 내어 관계가 악화될 수 있습니다",
    "신체적 긴장과 스트레스가 누적됩니다",
    "현실적 해결책 대신 회피나 도피를 선택할 수 있습니다",
  ],
  불안: [
    "과도한 걱정으로 현재를 즐기지 못하고 삶의 질이 떨어집니다",
    "신체 증상(두근거림, 떨림, 불면)이 나타나 건강을 해칩니다",
    "회피 행동이 심해져 일상생활이 제한됩니다",
    "만성화되면 불안 장애나 공황 장애로 발전할 수 있습니다",
    "지나친 완벽주의로 스트레스가 가중됩니다",
  ],
  짜증: [
    "사소한 일에도 과민 반응하여 관계가 틀어질 수 있습니다",
    "타인을 불편하게 만들고 멀어지게 합니다",
    "자신도 피곤해지고 에너지가 고갈됩니다",
    "문제의 본질을 보지 못하고 증상에만 반응하게 됩니다",
    "습관화되면 만성적 스트레스 상태가 됩니다",
  ],
};
