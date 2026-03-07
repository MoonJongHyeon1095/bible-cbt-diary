import type { EmotionOption } from "./emotions";

export const POSITIVE_EMOTIONS: EmotionOption[] = [
  {
    id: "joy",
    label: "기쁨",
    description: "바라던 일이 이루어질 때 생기는 밝고 가벼운 감정",
    physical: "몸이 가볍고 에너지가 올라오며 자연스럽게 미소가 지어짐",
    color: "bg-amber-50 border-amber-300 hover:border-amber-500",
    positive: [
      "기쁨은 새로운 시도와 놀이 같은 태도를 이끌어 삶의 활력을 높입니다.",
      "작은 성취를 기뻐하는 습관은 회복탄력성과 일상 만족도를 키웁니다.",
    ],
    caution: [
      "같은 자극이 반복되면 익숙해져 처음만큼 크게 느껴지지 않을 수 있습니다.",
      "지나친 쾌락 추구는 충동적 선택이나 무리한 행동으로 이어질 수 있습니다.",
    ],
  },
  {
    id: "gratitude",
    label: "감사",
    description: "주어진 도움과 환경에 고마움을 느끼는 감정",
    physical: "가슴이 따뜻해지고 표정이 부드러워지며 관계에 마음이 열림",
    color: "bg-emerald-50 border-emerald-300 hover:border-emerald-500",
    positive: [
      "감사는 타인과의 유대감을 강화하고 관계의 신뢰를 깊게 만듭니다.",
      "현재 삶을 풍요롭게 인식하게 해 심리적 안녕감의 기반이 됩니다.",
    ],
    caution: [
      "감사를 의무감이나 빚진 마음과 혼동하면 오히려 부담이 커질 수 있습니다.",
      "관계의 힘이 기울어진 상황에서는 감사 표현이 강요처럼 느껴질 수 있습니다.",
    ],
  },
  {
    id: "serenity",
    label: "평온",
    description: "자극은 적지만 마음이 고요하고 안전한 상태",
    physical: "호흡이 안정되고 긴장이 풀리며 몸과 마음이 차분해짐",
    color: "bg-sky-50 border-sky-300 hover:border-sky-500",
    positive: [
      "평온은 내면을 정리하고 에너지를 회복하는 시간을 제공합니다.",
      "삶의 조화감을 높여 장기적인 스트레스 완충 효과를 줍니다.",
    ],
    caution: [
      "평온이 무기력이나 동기 저하와 섞여 느껴질 때는 상태를 구분해 볼 필요가 있습니다.",
      "일부 사람에게는 이완 자체가 오히려 불안을 자극할 수 있습니다.",
    ],
  },
  {
    id: "interest",
    label: "흥미",
    description: "새로운 대상을 탐색하고 싶은 호기심의 감정",
    physical: "집중이 또렷해지고 눈빛이 살아나며 시간 가는 줄 모르게 됨",
    color: "bg-cyan-50 border-cyan-300 hover:border-cyan-500",
    positive: [
      "흥미는 탐구와 몰입을 유도해 역량 확장과 성장을 촉진합니다.",
      "배움과 경험의 폭을 넓혀 자기효능감을 높이는 동력이 됩니다.",
    ],
    caution: [
      "지나친 새로움 추구는 산만함과 집중 분산으로 이어질 수 있습니다.",
      "흥미가 강박적 몰입으로 바뀌지 않도록 리듬과 휴식이 필요합니다.",
    ],
  },
  {
    id: "hope",
    label: "희망",
    description: "어려움 속에서도 미래의 가능성을 믿는 감정",
    physical: "무거웠던 몸이 조금 가벼워지고 다시 시도할 힘이 생김",
    color: "bg-lime-50 border-lime-300 hover:border-lime-500",
    positive: [
      "희망은 회복탄력성을 높여 포기하지 않고 앞으로 나아가게 합니다.",
      "불확실한 상황에서도 행동을 지속하게 하는 의지의 근원이 됩니다.",
    ],
    caution: [
      "근거 없는 낙관은 현실의 위험 신호를 과소평가하게 만들 수 있습니다.",
      "행동 없는 소망에만 머무르면 실제 변화로 이어지기 어렵습니다.",
    ],
  },
  {
    id: "pride",
    label: "자부심",
    description: "노력의 성과를 확인하며 자신을 긍정적으로 평가하는 감정",
    physical: "어깨가 펴지고 표정이 당당해지며 자신감이 또렷해짐",
    color: "bg-violet-50 border-violet-300 hover:border-violet-500",
    positive: [
      "자부심은 자신의 가치를 확인하게 하여 건강한 자신감을 만듭니다.",
      "다음 단계에 도전할 용기와 지속 동기를 강화합니다.",
    ],
    caution: [
      "건강한 자부심이 거만함으로 기울면 관계가 손상될 수 있습니다.",
      "타인과의 비교에 기대는 자부심은 쉽게 흔들릴 수 있습니다.",
    ],
  },
  {
    id: "amusement",
    label: "재미",
    description: "웃음과 유머에서 오는 가벼운 즐거움의 감정",
    physical: "얼굴 근육이 풀리고 웃음이 나오며 긴장이 완화됨",
    color: "bg-orange-50 border-orange-300 hover:border-orange-500",
    positive: [
      "재미는 긴장을 해소하고 정신적 여유를 회복하게 합니다.",
      "함께 웃는 경험은 사회적 결속감과 친밀감을 높입니다.",
    ],
    caution: [
      "공격적이거나 자기비하적인 유머는 오히려 자신과 관계를 해칠 수 있습니다.",
      "유머는 상황과 상대의 맥락을 고려하지 않으면 불편함을 만들 수 있습니다.",
    ],
  },
  {
    id: "inspiration",
    label: "영감",
    description: "위대한 가치나 아름다움을 보고 마음이 고양되는 감정",
    physical: "가슴이 뜨거워지고 생각이 맑아지며 행동 의지가 커짐",
    color: "bg-fuchsia-50 border-fuchsia-300 hover:border-fuchsia-500",
    positive: [
      "영감은 더 나은 기준을 향해 삶의 방향을 끌어올립니다.",
      "새로운 창작과 실천을 시작하게 하는 강한 내적 동기가 됩니다.",
    ],
    caution: [
      "너무 먼 롤모델과 자신을 비교하면 오히려 좌절감이 커질 수 있습니다.",
      "영감이 행동으로 이어지지 않으면 공허한 고양감으로 끝날 수 있습니다.",
    ],
  },
  {
    id: "awe",
    label: "경외감",
    description: "압도적인 자연·진리 앞에서 느끼는 경탄의 감정",
    physical: "숨이 멎는 듯 집중되고 마음이 넓어지는 느낌이 듦",
    color: "bg-indigo-50 border-indigo-300 hover:border-indigo-500",
    positive: [
      "경외감은 자아 중심성을 낮추고 더 넓은 관점을 갖게 합니다.",
      "세상과의 연결감을 높여 삶의 의미를 깊게 체감하게 합니다.",
    ],
    caution: [
      "압도감이 너무 강하면 경외가 공포나 위축으로 바뀔 수 있습니다.",
      "강렬한 경험은 일상 안에서 소화하고 통합하는 시간이 필요합니다.",
    ],
  },
  {
    id: "love",
    label: "사랑",
    description: "기쁨·감사·평온이 관계 안에서 통합되는 포괄적 감정",
    physical: "마음이 따뜻해지고 안정감이 커지며 타인을 향해 열림",
    color: "bg-rose-50 border-rose-300 hover:border-rose-500",
    positive: [
      "사랑은 관계를 지속시키고 상호 돌봄을 가능하게 하는 핵심 정서입니다.",
      "함께 기쁨과 평온을 나누며 삶의 의미와 안정감을 확장합니다.",
    ],
    caution: [
      "불안정한 애착이나 관계 불안이 큰 경우 사랑이 오히려 불안을 키울 수 있습니다.",
      "집착과 통제, 표현의 강요는 사랑이 아니라 관계 손상으로 이어집니다.",
    ],
  },
];
