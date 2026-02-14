"use client";

import { useCallback } from "react";
import { useAccessContext } from "@/lib/hooks/useAccessContext";

type UseCbtAccessOptions = {
  setError: (message: string) => void;
};

export function useCbtAccess({ setError }: UseCbtAccessOptions) {
  const { accessMode, accessToken, isBlocked } = useAccessContext();

  const getAccessContext = useCallback(
    async () => ({
      mode: accessMode,
      accessToken,
    }),
    [accessMode, accessToken],
  );

  const requireAccessContext = useCallback(
    async (messageText = "로그인이 필요합니다.") => {
      if (isBlocked) {
        setError(messageText);
        return null;
      }
      return {
        mode: accessMode,
        accessToken,
      };
    },
    [accessMode, accessToken, isBlocked, setError],
  );

  return {
    accessMode,
    accessToken,
    getAccessContext,
    requireAccessContext,
  };
}
