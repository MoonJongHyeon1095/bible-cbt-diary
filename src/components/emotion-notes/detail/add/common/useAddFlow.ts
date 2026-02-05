import { useMemo, useReducer } from "react";
import type { AddMode } from "../pages/EmotionNoteAddModeSelector";

type AddFlowState = {
  mode: AddMode | null;
  aiStep: string;
  directStep: string;
  aiLoading: boolean;
  aiError: string | null;
  aiFallback: boolean;
  isSaving: boolean;
};

type AddFlowInit = {
  initialMode: AddMode | null;
  initialAiStep: string;
  initialDirectStep: string;
};

type AddFlowAction =
  | { type: "SET_MODE"; mode: AddMode | null }
  | { type: "RESET"; payload?: Partial<AddFlowState> }
  | { type: "SET_AI_STEP"; step: string }
  | { type: "SET_DIRECT_STEP"; step: string }
  | { type: "AI_START" }
  | { type: "AI_FINISH" }
  | { type: "SET_AI_ERROR"; message: string | null }
  | { type: "SET_AI_FALLBACK"; value: boolean }
  | { type: "SET_SAVING"; value: boolean };

const buildInitialState = (init: AddFlowInit): AddFlowState => ({
  mode: init.initialMode,
  aiStep: init.initialAiStep,
  directStep: init.initialDirectStep,
  aiLoading: false,
  aiError: null,
  aiFallback: false,
  isSaving: false,
});

const reducer = (state: AddFlowState, action: AddFlowAction): AddFlowState => {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "RESET":
      return {
        ...state,
        aiLoading: false,
        aiError: null,
        aiFallback: false,
        isSaving: false,
        ...action.payload,
      };
    case "SET_AI_STEP":
      return { ...state, aiStep: action.step };
    case "SET_DIRECT_STEP":
      return { ...state, directStep: action.step };
    case "AI_START":
      return { ...state, aiLoading: true, aiError: null, aiFallback: false };
    case "AI_FINISH":
      return { ...state, aiLoading: false };
    case "SET_AI_ERROR":
      return { ...state, aiError: action.message };
    case "SET_AI_FALLBACK":
      return { ...state, aiFallback: action.value };
    case "SET_SAVING":
      return { ...state, isSaving: action.value };
    default:
      return state;
  }
};

export function useAddFlow(init: AddFlowInit) {
  const [state, dispatch] = useReducer(reducer, init, buildInitialState);

  const actions = useMemo(
    () => ({
      setMode: (mode: AddMode | null) => dispatch({ type: "SET_MODE", mode }),
      reset: (payload?: Partial<AddFlowState>) =>
        dispatch({ type: "RESET", payload }),
      setAiStep: (step: string) => dispatch({ type: "SET_AI_STEP", step }),
      setDirectStep: (step: string) =>
        dispatch({ type: "SET_DIRECT_STEP", step }),
      startAi: () => dispatch({ type: "AI_START" }),
      finishAi: () => dispatch({ type: "AI_FINISH" }),
      setAiError: (message: string | null) =>
        dispatch({ type: "SET_AI_ERROR", message }),
      setAiFallback: (value: boolean) =>
        dispatch({ type: "SET_AI_FALLBACK", value }),
      setSaving: (value: boolean) => dispatch({ type: "SET_SAVING", value }),
    }),
    [],
  );

  return { state, actions };
}
