import { useEffect, useRef } from "react";
import type { DeepStep } from "@/components/session/hooks/useCbtDeepSessionFlow";

type UseDeepSessionInitializationParams = {
  routeInitKey: string;
  shouldSelectSubNotes: boolean;
  hasPendingDeepRestore: boolean;
  setStep: (step: DeepStep) => void;
};

export function useDeepSessionInitialization({
  routeInitKey,
  shouldSelectSubNotes,
  hasPendingDeepRestore,
  setStep,
}: UseDeepSessionInitializationParams) {
  const initializedRouteKeyRef = useRef("");

  useEffect(() => {
    if (initializedRouteKeyRef.current === routeInitKey) return;
    initializedRouteKeyRef.current = routeInitKey;
    if (hasPendingDeepRestore) return;
    setStep(shouldSelectSubNotes ? "select" : "mood");
  }, [hasPendingDeepRestore, routeInitKey, setStep, shouldSelectSubNotes]);
}

