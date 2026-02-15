import { useMemo, useReducer } from "react";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/sessionTypes";

export type MinimalStep =
  | "mood"
  | "incident"
  | "emotion"
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
export const MINIMAL_ALTERNATIVE_STEPS: ReadonlyArray<MinimalStep> = [
  "alternative",
];

type FlowState = {
  step: MinimalStep;
  userInput: string;
  selectedEmotion: string;
  emotionThoughtPairs: EmotionThoughtPair[];
  selectedCognitiveErrors: SelectedCognitiveError[];
  alternativeSeed: number;
};

type FlowAction =
  | { type: "SET_STEP"; step: MinimalStep }
  | { type: "SET_USER_INPUT"; value: string }
  | { type: "SET_SELECTED_EMOTION"; value: string }
  | {
      type: "SET_DISTORTION";
      thought: string;
      emotion: string;
      error: SelectedCognitiveError;
      seedBump: boolean;
    }
  | { type: "RESET_FLOW" };

const initialFlowState: FlowState = {
  step: "mood",
  userInput: "",
  selectedEmotion: "",
  emotionThoughtPairs: [],
  selectedCognitiveErrors: [],
  alternativeSeed: 0,
};

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
        emotionThoughtPairs: [
          { emotion: action.emotion, intensity: null, thought: action.thought },
        ],
        selectedCognitiveErrors: [action.error],
        alternativeSeed: action.seedBump
          ? state.alternativeSeed + 1
          : state.alternativeSeed,
        step: "alternative",
      };
    case "RESET_FLOW":
      return initialFlowState;
    default:
      return state;
  }
};

export function useCbtMinimalSessionFlow() {
  const [state, dispatch] = useReducer(reducer, initialFlowState);
  const actions = useMemo(
    () => ({
      setStep: (step: MinimalStep) => dispatch({ type: "SET_STEP", step }),
      setUserInput: (value: string) =>
        dispatch({ type: "SET_USER_INPUT", value }),
      setSelectedEmotion: (value: string) =>
        dispatch({ type: "SET_SELECTED_EMOTION", value }),
      setDistortion: (
        thought: string,
        emotion: string,
        error: SelectedCognitiveError,
        seedBump: boolean,
      ) =>
        dispatch({
          type: "SET_DISTORTION",
          thought,
          emotion,
          error,
          seedBump,
        }),
      reset: () => dispatch({ type: "RESET_FLOW" }),
    }),
    [],
  );

  return { state, actions };
}
