import { useMemo, useReducer } from "react";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/sessionTypes";
import {
  createSessionFlowReducer,
  type SessionFlowBaseState,
} from "@/components/session/common/sessionFlowCore";

export type MinimalStep =
  | "mood"
  | "incident"
  | "emotion"
  | "sdt"
  | "distortion"
  | "alternative";

export const MINIMAL_MOOD_STEPS: ReadonlyArray<MinimalStep> = ["mood"];
export const MINIMAL_INCIDENT_STEPS: ReadonlyArray<MinimalStep> = ["incident"];
export const MINIMAL_EMOTION_SELECT_STEPS: ReadonlyArray<MinimalStep> = [
  "emotion",
];
export const MINIMAL_DISTORTION_STEPS: ReadonlyArray<MinimalStep> = [
  "distortion",
];
export const MINIMAL_SDT_STEPS: ReadonlyArray<MinimalStep> = ["sdt"];
export const MINIMAL_ALTERNATIVE_STEPS: ReadonlyArray<MinimalStep> = [
  "alternative",
];

type FlowState = SessionFlowBaseState<MinimalStep> & {
  emotionThoughtPairs: EmotionThoughtPair[];
};

type DistortionPayload = {
  thought: string;
  emotion: string;
};

const buildInitialState = (step: MinimalStep): FlowState => ({
  step,
  userInput: "",
  selectedEmotions: [],
  noteTitle: "",
  emotionThoughtPairs: [],
  selectedCognitiveErrors: [],
  alternativeSeed: 0,
});

const reducer = createSessionFlowReducer<
  MinimalStep,
  { emotionThoughtPairs: EmotionThoughtPair[] },
  DistortionPayload
>({
  buildInitialState,
  applyDistortion: (state, payload, error, seedBump) => ({
    ...state,
    emotionThoughtPairs: [
      { emotion: payload.emotion, intensity: null, thought: payload.thought },
    ],
    selectedCognitiveErrors: [error],
    alternativeSeed: seedBump
      ? state.alternativeSeed + 1
      : state.alternativeSeed,
    step: "alternative",
  }),
});

export function useCbtMinimalSessionFlow() {
  const [state, dispatch] = useReducer(reducer, "mood", buildInitialState);
  const actions = useMemo(
    () => ({
      setStep: (step: MinimalStep) => dispatch({ type: "SET_STEP", step }),
      setUserInput: (value: string) =>
        dispatch({ type: "SET_USER_INPUT", value }),
      setSelectedEmotions: (value: string[]) =>
        dispatch({ type: "SET_SELECTED_EMOTIONS", value }),
      setNoteTitle: (value: string) =>
        dispatch({ type: "SET_NOTE_TITLE", value }),
      setDistortion: (
        thought: string,
        emotion: string,
        error: SelectedCognitiveError,
        seedBump: boolean,
      ) =>
        dispatch({
          type: "APPLY_DISTORTION",
          payload: { thought, emotion },
          error,
          seedBump,
        }),
      reset: () => dispatch({ type: "RESET_FLOW", step: "mood" }),
    }),
    [],
  );

  return { state, actions };
}
