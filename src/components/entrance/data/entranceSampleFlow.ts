import type {
  EmotionNote,
  EmotionNoteMiddle,
} from "@/lib/types/emotionNoteTypes";

export const ENTRANCE_SAMPLE_FLOW_ID = -10;
export const ENTRANCE_SAMPLE_MAIN_NOTE_ID = -5;
export const ENTRANCE_SAMPLE_SUB_NOTE_ID = -2;

export const ENTRANCE_SAMPLE_NOTES: EmotionNote[] = [
  // 샘플 노드 4
  {
    id: -2,
    title: "슬픔의 기록",
    trigger_text: `
앱을 만들기는 했지만, 또 나혼자만 볼 무엇을 만든 것 같다.
딱히 남에게 보여주려고 만든 건 아니지만...`,
    created_at: "2026-02-13T09:00:00+09:00",
    thought_details: [],
    error_details: [],
    alternative_details: [],
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
    thought_details: [],
    error_details: [],
    alternative_details: [],
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
    thought_details: [],
    error_details: [],
    alternative_details: [],
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
    thought_details: [],
    error_details: [],
    alternative_details: [],
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
