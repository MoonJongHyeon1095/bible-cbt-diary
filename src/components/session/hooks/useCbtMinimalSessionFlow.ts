import { useMemo, useReducer } from "react";
import type {
  EmotionThoughtPair,
  SelectedCognitiveError,
} from "@/lib/types/sessionTypes";

export type MinimalStep =
  | "incident"
  | "thought"
  | "errors"
  | "alternative";

export const MINIMAL_INCIDENT_STEPS: ReadonlyArray<MinimalStep> = ["incident"];
export const MINIMAL_AUTO_THOUGHT_STEPS: ReadonlyArray<MinimalStep> = [
  "thought",
];
export const MINIMAL_COGNITIVE_ERROR_STEPS: ReadonlyArray<MinimalStep> = [
  "errors",
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
  autoThoughtWantsCustom: boolean;
  alternativeSeed: number;
};

type FlowAction =
  | { type: "SET_STEP"; step: MinimalStep }
  | { type: "SET_USER_INPUT"; value: string }
  | { type: "SET_SELECTED_EMOTION"; value: string }
  | { type: "SET_THOUGHT_PAIR"; thought: string; emotion: string }
  | { type: "SET_ERRORS"; errors: SelectedCognitiveError[]; seedBump: boolean }
  | { type: "SET_WANTS_CUSTOM"; value: boolean }
  | { type: "RESET_FLOW" };

const initialFlowState: FlowState = {
  step: "incident",
  userInput: "",
  selectedEmotion: "",
  emotionThoughtPairs: [],
  selectedCognitiveErrors: [],
  autoThoughtWantsCustom: false,
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
    case "SET_THOUGHT_PAIR":
      return {
        ...state,
        emotionThoughtPairs: [
          { emotion: action.emotion, intensity: null, thought: action.thought },
        ],
        step: "errors",
      };
    case "SET_ERRORS":
      return {
        ...state,
        selectedCognitiveErrors: action.errors,
        alternativeSeed: action.seedBump
          ? state.alternativeSeed + 1
          : state.alternativeSeed,
        step: "alternative",
      };
    case "SET_WANTS_CUSTOM":
      return { ...state, autoThoughtWantsCustom: action.value };
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
      setThoughtPair: (thought: string, emotion: string) =>
        dispatch({ type: "SET_THOUGHT_PAIR", thought, emotion }),
      setErrors: (errors: SelectedCognitiveError[], seedBump: boolean) =>
        dispatch({ type: "SET_ERRORS", errors, seedBump }),
      setWantsCustom: (value: boolean) =>
        dispatch({ type: "SET_WANTS_CUSTOM", value }),
      reset: () => dispatch({ type: "RESET_FLOW" }),
    }),
    [],
  );

  return { state, actions };
}
