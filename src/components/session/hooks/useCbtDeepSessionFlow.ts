import { useMemo, useReducer } from "react";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";
import {
  createSessionFlowReducer,
  type SessionFlowBaseState,
} from "@/components/session/common/sessionFlowCore";

export type DeepStep =
  | "select"
  | "mood"
  | "incident"
  | "emotion"
  | "distortion"
  | "alternative";

export const DEEP_NOTE_SELECT_STEPS: ReadonlyArray<DeepStep> = [
  "select",
];
export const DEEP_MOOD_STEPS: ReadonlyArray<DeepStep> = ["mood"];
export const DEEP_INCIDENT_STEPS: ReadonlyArray<DeepStep> = [
  "incident",
];
export const DEEP_EMOTION_SELECT_STEPS: ReadonlyArray<DeepStep> = [
  "emotion",
];
export const DEEP_DISTORTION_STEPS: ReadonlyArray<DeepStep> = ["distortion"];
export const DEEP_ALTERNATIVE_STEPS: ReadonlyArray<DeepStep> = ["alternative"];

type FlowState = SessionFlowBaseState<DeepStep> & {
  autoThought: string;
};

type DistortionPayload = {
  thought: string;
};

const buildInitialState = (step: DeepStep): FlowState => ({
  step,
  userInput: "",
  selectedEmotions: [],
  noteTitle: "",
  autoThought: "",
  selectedCognitiveErrors: [],
  alternativeSeed: 0,
});

const reducer = createSessionFlowReducer<
  DeepStep,
  { autoThought: string },
  DistortionPayload
>({
  buildInitialState,
  applyDistortion: (state, payload, error, seedBump) => ({
    ...state,
    autoThought: payload.thought,
    selectedCognitiveErrors: [error],
    alternativeSeed: seedBump ? state.alternativeSeed + 1 : state.alternativeSeed,
    step: "alternative",
  }),
});

export function useCbtDeepSessionFlow(initialStep: DeepStep) {
  const [state, dispatch] = useReducer(
    reducer,
    initialStep,
    buildInitialState,
  );
  const actions = useMemo(
    () => ({
      setStep: (step: DeepStep) => dispatch({ type: "SET_STEP", step }),
      setUserInput: (value: string) =>
        dispatch({ type: "SET_USER_INPUT", value }),
      setSelectedEmotions: (value: string[]) =>
        dispatch({ type: "SET_SELECTED_EMOTIONS", value }),
      setNoteTitle: (value: string) =>
        dispatch({ type: "SET_NOTE_TITLE", value }),
      setDistortion: (
        thought: string,
        error: SelectedCognitiveError,
        seedBump: boolean,
      ) =>
        dispatch({
          type: "APPLY_DISTORTION",
          payload: { thought },
          error,
          seedBump,
        }),
      reset: (step: DeepStep) => dispatch({ type: "RESET_FLOW", step }),
    }),
    [],
  );

  return { state, actions };
}
