import { useCallback, useEffect, useRef, useState } from "react";

type UseLeaveConfirmParams<TStep extends string> = {
  step: TStep;
  protectedSteps: readonly TStep[];
  onLeave: () => void;
  interceptBrowserBack?: boolean;
  interceptBeforeUnload?: boolean;
};

export function useLeaveConfirm<TStep extends string>({
  step,
  protectedSteps,
  onLeave,
  interceptBrowserBack = true,
  interceptBeforeUnload = true,
}: UseLeaveConfirmParams<TStep>) {
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const bypassBackGuardRef = useRef(false);
  const isProtected = protectedSteps.includes(step);

  const requestLeave = useCallback(
    (actionOrEvent?: unknown) => {
      const nextAction =
        typeof actionOrEvent === "function" ? (actionOrEvent as () => void) : onLeave;
      if (isProtected) {
        pendingActionRef.current = nextAction;
        setShowConfirm(true);
        return;
      }
      nextAction();
    },
    [isProtected, onLeave],
  );

  const cancelLeave = useCallback(() => {
    pendingActionRef.current = null;
    setShowConfirm(false);
  }, []);

  const confirmLeave = useCallback(() => {
    const nextAction = pendingActionRef.current ?? onLeave;
    pendingActionRef.current = null;
    setShowConfirm(false);
    nextAction();
  }, [onLeave]);

  useEffect(() => {
    if (!interceptBeforeUnload) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isProtected) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [interceptBeforeUnload, isProtected]);

  useEffect(() => {
    if (!interceptBrowserBack) return;
    const handlePopState = () => {
      if (bypassBackGuardRef.current) {
        bypassBackGuardRef.current = false;
        return;
      }
      if (!isProtected) return;
      // Keep user on the current page, then ask for confirmation.
      window.history.go(1);
      requestLeave(() => {
        bypassBackGuardRef.current = true;
        window.history.back();
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [interceptBrowserBack, isProtected, requestLeave]);

  return {
    showConfirm,
    requestLeave,
    cancelLeave,
    confirmLeave,
  };
}
