import { useMemo, useReducer } from "react";
import type { SelectedCognitiveError } from "@/lib/types/cbtTypes";

export type DeepStep =
  | "select"
  | "incident"
  | "emotion"
  | "thought"
  | "errors"
  | "alternative";

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
  | { type: "SET_AUTO_THOUGHT"; value: string }
  | { type: "SET_ERRORS"; errors: SelectedCognitiveError[]; seedBump: boolean }
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
    case "SET_AUTO_THOUGHT":
      return { ...state, autoThought: action.value, step: "errors" };
    case "SET_ERRORS":
      return {
        ...state,
        selectedCognitiveErrors: action.errors,
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
      setAutoThought: (value: string) =>
        dispatch({ type: "SET_AUTO_THOUGHT", value }),
      setErrors: (errors: SelectedCognitiveError[], seedBump: boolean) =>
        dispatch({ type: "SET_ERRORS", errors, seedBump }),
      reset: (step: DeepStep) => dispatch({ type: "RESET_FLOW", step }),
    }),
    [],
  );

  return { state, actions };
}
