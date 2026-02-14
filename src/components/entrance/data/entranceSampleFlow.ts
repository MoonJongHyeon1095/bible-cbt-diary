import type {
  EmotionNote,
  EmotionNoteMiddle,
} from "@/lib/types/emotionNoteTypes";

export const ENTRANCE_SAMPLE_FLOW_ID = -10;
export const ENTRANCE_SAMPLE_MAIN_NOTE_ID = -5;
export const ENTRANCE_SAMPLE_SUB_NOTE_ID = -2;
export const ENTRANCE_SAMPLE_FLOW = {
  id: ENTRANCE_SAMPLE_FLOW_ID,
  title: "겁쟁이의 기록 흐름",
  description:
    "오래된 두려움과 수치심이 현재의 슬픔으로 이어지는 감정 흐름 샘플입니다.",
} as const;

export const ENTRANCE_SAMPLE_NOTES: EmotionNote[] = [
  // 샘플 노드 4
  {
    id: -2,
    title: "슬픔의 기록",
    trigger_text: `
앱을 만들기는 했지만, 또 나혼자만 볼 무엇을 만든 것 같다.
딱히 남에게 보여주려고 만든 건 아니지만...`,
    created_at: "2026-02-13T09:00:00+09:00",
    thought_details: [
      {
        id: -2,
        note_id: -2,
        automatic_thought: `나는 내 선택이 다른 사람에게 부정적으로 평가될 것이라고 믿는다. 이런 생각 때문에 나는 내 의사를 표현하는 것을 두려워한다. 내가 나의 선택을 부끄러워하면, 나는 스스로를 잃게 될 것이다.`,
        emotion: "슬픔",
        created_at: "2026-02-13T09:00:00+09:00",
      },
    ],
    error_details: [
      {
        id: -2,
        note_id: -2,
        error_label: "정신적 여과",
        error_description:
          "당신은 자신의 선택에 대해 부정적인 측면만을 강조하며 긍정적인 요소를 간과하고 있습니다. 이는 '내 선택이 부끄럽다'는 생각에서 비롯된 정신적 필터링으로, 자신의 노력이나 성취를 무시하게 만듭니다. 이러한 사고는 자신에 대한 부정적인 감정을 더욱 강화할 수 있습니다. 긍정적인 피드백을 어떻게 받아들이고 계신가요?",
        created_at: "2026-02-13T09:00:00+09:00",
      },
    ],
    alternative_details: [
      {
        id: -2,
        note_id: -2,
        alternative: `내가 만든 앱이 다른 사람들에게 어떻게 평가될지는 중요하지 않다. 중요한 것은 내가 이 과정을 통해 성장하고 있다는 점이다. 나의 선택과 노력은 나를 구성하는 중요한 부분이며, 나는 나 자신을 있는 그대로 받아들이고 존중할 필요가 있다.`,
        created_at: "2026-02-13T09:00:00+09:00",
      },
    ],
    behavior_details: [],
  },
  {
    id: -3,
    title: "수치심의 기록",
    trigger_text: `앱을 만드는 도중, 테스트 유저에게 아주 짧은 메일을 받았다.
'그런데 안드로이드 플랫폼 출시는 어려우실 거에요.'
뭐 맞는 말이다. 
실사용자가 따라올 만한 앱은 아니니까.
그래도 창피한 건 어쩔 수 없다.
    `,
    created_at: "2026-02-10T09:00:00+09:00",
    thought_details: [
      {
        id: -3,
        note_id: -3,
        automatic_thought: `나는 내 코드를 보여주면 누군가 나를 판단할 것이라고 생각한다. 그렇기 때문에 나는 다른 사람들과의 연결을 두려워한다. 내가 부끄러운 모습을 보이면, 나와의 관계가 소원해질 것이다.`,
        emotion: "수치심",
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    error_details: [
      {
        id: -3,
        note_id: -3,
        error_label: "정신적 여과",
        error_description:
          "부정적인 경험에 대한 정신적 필터가 작용하고 있습니다. 사용자의 메일로 인해 자신이 부적절하게 인식될 것이라는 생각이 강조되고, 긍정적인 피드백이나 가능성은 간과되고 있습니다. 이는 자신이 겪는 부정적인 감정이 모든 상황에 적용된다는 것을 보여줍니다. 이러한 필터가 강화될 수 있으며, '내가 보여준 코드에 대해 긍정적인 반응이 있을 수는 없을까?'라는 질문을 고려해볼 필요가 있습니다.",
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    alternative_details: [
      {
        id: -3,
        note_id: -3,
        alternative: `내가 보여준 코드에 대한 부정적인 반응이 있을 수 있지만, 그 반응이 나의 전체 가치를 결정짓는 것은 아니다. 많은 사람들이 나의 노력을 이해하고 긍정적으로 평가할 가능성도 있다. 또한, 앱 개발은 과정이며, 모든 피드백은 나의 성장에 도움이 될 수 있다.`,
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    behavior_details: [],
  },
  {
    id: -4,
    title: "두려움의 기록",
    trigger_text: `
내 코드를 남에게 보여주는 것이 무섭다.
내가 짠 코드가 이상할까봐, 내가 짠 코드가 부끄러울까봐.
그리고 내가 그걸 부끄러워한다는 사실을 들킬까봐 무섭다.
    `,
    created_at: "2025-02-10T09:00:00+09:00",
    thought_details: [
      {
        id: -4,
        note_id: -4,
        automatic_thought: `나는 내가 짠 코드가 부끄럽고 이상할 것이라고 생각한다. 내가 서투르게 보일까 봐 두렵다. 그래서 나는 나의 가치를 의심하게 된다.`,
        emotion: "두려움",
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    error_details: [
      {
        id: -4,
        note_id: -4,
        error_label: "전부 아니면 전무 사고",
        error_description:
          "모든 것이 완벽해야 한다는 생각이 드러나며, 내가 짠 코드가 부끄럽고 이상할 것이라는 극단적인 결론에 도달하고 있다. 이는 내가 소통할 때 오해를 받을 것이라는 조건부 규칙과 연결되어 있다. 이러한 극단적인 사고는 나의 가치에 대한 의심으로 이어지며, 이는 소통의 두려움과 연결된 긴장감을 더욱 강화할 수 있다. 감정이 심화될 수 있으며, '내가 소통할 때 오해를 받을 것이라는 믿음이 나를 어떻게 제한하고 있는가?'라는 질문을 던져볼 필요가 있다.",
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    alternative_details: [
      {
        id: -4,
        note_id: -4,
        alternative: `내가 코드를 작성하는 과정에서 많은 노력을 기울였다는 사실을 잊지 말아야 한다. 나는 이미 많은 것을 배우고 성장해왔고, 이러한 경험이 나를 더욱 강하게 만들었다. 나의 코드는 나의 노력과 열정의 결과물이며, 이는 나의 가치를 증명하는 중요한 요소이다.`,
        created_at: "2025-02-10T09:00:00+09:00",
      },
    ],
    behavior_details: [],
  },
  {
    id: -5,
    title: "두려움의 기록",
    trigger_text: `밥을 같이 먹기 싫어서 거짓말을 하고 도망쳤다.
내 이야기를 하는 것도 싫고 상대방 이야기를 듣는 것도 싫다.
내 이야기를 하면 어차피 못알아들을 텐데, 상대방은 멋대로 오해할테니까.
하지만 그건 둘째치고, 그냥 그 자리가 무섭다.
한국식 컨벤션에 맞추어 말하지 못하고 서투르게 말할까봐.
내가 서투르게 보일 것이 무섭다.
    `,
    created_at: "2020-02-01T09:00:00+09:00",
    thought_details: [
      {
        id: -5,
        note_id: -5,
        automatic_thought: `나는 내 이야기를 상대방이 이해하지 못할 것이라고 생각한다. 그렇기 때문에 나는 나의 감정을 공유할 수 없고, 결국 관계가 소원해질 것이다.`,
        emotion: "두려움",
        created_at: "2020-02-01T09:00:00+09:00",
      },
    ],
    error_details: [
      {
        id: -5,
        note_id: -5,
        error_label: "감정적 추론",
        error_description:
          "상대방이 내 이야기를 이해하지 못할 것이라는 생각은 감정적 추론의 예입니다. 당신은 현재의 불안감 때문에 상대방이 당신의 이야기를 오해할 것이라고 믿고 있지만, 이는 사실이 아닐 수 있습니다. 이러한 감정이 사실처럼 느껴질 수 있지만, 실제로는 상대방이 어떻게 반응할지에 대한 명확한 증거가 없습니다. 감정이 강화되면 더욱 두려워질 수 있으며, '상대방이 나를 이해하지 못할까?'라는 질문을 스스로 해보는 것이 도움이 될 수 있습니다.",
        created_at: "2020-02-01T09:00:00+09:00",
      },
    ],
    alternative_details: [
      {
        id: -5,
        note_id: -5,
        alternative: `내가 서투르게 말할까 봐 두려워하는 것은 자연스러운 감정이다. 모든 사람은 완벽하지 않으며, 나도 그 중 하나라는 것을 인정해야 한다. 나의 서툴음이 나를 덜 가치 있게 만들지 않으며, 나 자신을 있는 그대로 받아들이는 것이 중요하다. 나의 감정과 불안은 나를 더욱 인간답게 만들어주는 요소이다.`,
        created_at: "2020-02-01T09:00:00+09:00",
      },
    ],
    behavior_details: [],
  },
];

export const ENTRANCE_SAMPLE_MIDDLES: EmotionNoteMiddle[] = [
  {
    id: -201,
    from_note_id: -5,
    to_note_id: -4,
    created_at: "2020-02-01T09:00:00+09:00",
  },
  {
    id: -202,
    from_note_id: -5,
    to_note_id: -3,
    created_at: "2020-02-01T09:00:00+09:00",
  },
  {
    id: -203,
    from_note_id: -4,
    to_note_id: -3,
    created_at: "2025-02-10T09:00:00+09:00",
  },
  {
    id: -204,
    from_note_id: -4,
    to_note_id: -2,
    created_at: "2025-02-10T09:00:00+09:00",
  },
  {
    id: -205,
    from_note_id: -3,
    to_note_id: -2,
    created_at: "2026-02-10T09:00:00+09:00",
  },
];
