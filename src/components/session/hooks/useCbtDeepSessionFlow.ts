import { useMemo, useReducer } from "react";
import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";

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

type FlowState = {
  step: DeepStep;
  userInput: string;
  selectedEmotion: string;
  autoThought: string;
  selectedCognitiveErrors: SelectedCognitiveError[];
  alternativeSeed: number;
};

type FlowAction =
  | { type: "SET_STEP"; step: DeepStep }
  | { type: "SET_USER_INPUT"; value: string }
  | { type: "SET_SELECTED_EMOTION"; value: string }
  | {
      type: "SET_DISTORTION";
      thought: string;
      error: SelectedCognitiveError;
      seedBump: boolean;
    }
  | { type: "RESET_FLOW"; step: DeepStep };

const buildInitialState = (step: DeepStep): FlowState => ({
  step,
  userInput: "",
  selectedEmotion: "",
  autoThought: "",
  selectedCognitiveErrors: [],
  alternativeSeed: 0,
});

const reducer = (state: FlowState, action: FlowAction): FlowState => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_USER_INPUT":
      return { ...state, userInput: action.value };
    case "SET_SELECTED_EMOTION":
      return { ...state, selectedEmotion: action.value };
    case "SET_DISTORTION":
      return {
        ...state,
        autoThought: action.thought,
        selectedCognitiveErrors: [action.error],
        alternativeSeed: action.seedBump
          ? state.alternativeSeed + 1
          : state.alternativeSeed,
        step: "alternative",
      };
    case "RESET_FLOW":
      return buildInitialState(action.step);
    default:
      return state;
  }
};

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
      setSelectedEmotion: (value: string) =>
        dispatch({ type: "SET_SELECTED_EMOTION", value }),
      setDistortion: (
        thought: string,
        error: SelectedCognitiveError,
        seedBump: boolean,
      ) =>
        dispatch({
          type: "SET_DISTORTION",
          thought,
          error,
          seedBump,
        }),
      reset: (step: DeepStep) => dispatch({ type: "RESET_FLOW", step }),
    }),
    [],
  );

  return { state, actions };
}
