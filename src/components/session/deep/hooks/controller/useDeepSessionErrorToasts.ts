import { useEffect } from "react";

type UseDeepSessionErrorToastsParams = {
  internalContextLoadError: string | null;
  montageScenarioError: string | null;
  montagePictureError: string | null;
  montageSaveError: string | null;
  pushToast: (message: string, type: "success" | "error") => void;
};

export function useDeepSessionErrorToasts({
  internalContextLoadError,
  montageScenarioError,
  montagePictureError,
  montageSaveError,
  pushToast,
}: UseDeepSessionErrorToastsParams) {
  useEffect(() => {
    if (!internalContextLoadError) return;
    pushToast(internalContextLoadError, "error");
  }, [internalContextLoadError, pushToast]);

  useEffect(() => {
    if (!montageScenarioError) return;
    pushToast(montageScenarioError, "error");
  }, [montageScenarioError, pushToast]);

  useEffect(() => {
    if (!montagePictureError) return;
    pushToast(montagePictureError, "error");
  }, [montagePictureError, pushToast]);

  useEffect(() => {
    if (!montageSaveError) return;
    pushToast(montageSaveError, "error");
  }, [montageSaveError, pushToast]);
}

