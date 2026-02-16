import type { SelectedCognitiveError } from "@/lib/types/sessionTypes";

export type SessionFlowBaseState<TStep extends string> = {
  step: TStep;
  userInput: string;
  selectedEmotions: string[];
  noteTitle: string;
  selectedCognitiveErrors: SelectedCognitiveError[];
  alternativeSeed: number;
};

type SetStepAction<TStep extends string> = {
  type: "SET_STEP";
  step: TStep;
};

type SetUserInputAction = {
  type: "SET_USER_INPUT";
  value: string;
};

type SetSelectedEmotionsAction = {
  type: "SET_SELECTED_EMOTIONS";
  value: string[];
};

type SetNoteTitleAction = {
  type: "SET_NOTE_TITLE";
  value: string;
};

type ApplyDistortionAction<TPayload> = {
  type: "APPLY_DISTORTION";
  payload: TPayload;
  error: SelectedCognitiveError;
  seedBump: boolean;
};

type ResetAction<TStep extends string> = {
  type: "RESET_FLOW";
  step: TStep;
};

export type SessionFlowCoreAction<TStep extends string, TPayload> =
  | SetStepAction<TStep>
  | SetUserInputAction
  | SetSelectedEmotionsAction
  | SetNoteTitleAction
  | ApplyDistortionAction<TPayload>
  | ResetAction<TStep>;

type SessionFlowCoreConfig<
  TStep extends string,
  TExtraState extends object,
  TPayload,
> = {
  buildInitialState: (
    step: TStep,
  ) => SessionFlowBaseState<TStep> & TExtraState;
  applyDistortion: (
    state: SessionFlowBaseState<TStep> & TExtraState,
    payload: TPayload,
    error: SelectedCognitiveError,
    seedBump: boolean,
  ) => SessionFlowBaseState<TStep> & TExtraState;
};

export function createSessionFlowReducer<
  TStep extends string,
  TExtraState extends object,
  TPayload,
>({
  buildInitialState,
  applyDistortion,
}: SessionFlowCoreConfig<TStep, TExtraState, TPayload>) {
  return (
    state: SessionFlowBaseState<TStep> & TExtraState,
    action: SessionFlowCoreAction<TStep, TPayload>,
  ): SessionFlowBaseState<TStep> & TExtraState => {
    switch (action.type) {
      case "SET_STEP":
        return { ...state, step: action.step };
      case "SET_USER_INPUT":
        return { ...state, userInput: action.value };
      case "SET_SELECTED_EMOTIONS":
        return {
          ...state,
          selectedEmotions: action.value,
        };
      case "SET_NOTE_TITLE":
        return { ...state, noteTitle: action.value };
      case "APPLY_DISTORTION":
        return applyDistortion(
          state,
          action.payload,
          action.error,
          action.seedBump,
        );
      case "RESET_FLOW":
        return buildInitialState(action.step);
      default:
        return state;
    }
  };
}
