"use client";

import { useCallback, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UseCbtAccessOptions = {
  setError: (message: string) => void;
};

export function useCbtAccess({ setError }: UseCbtAccessOptions) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const requireAccessToken = useCallback(
    async (messageText = "로그인이 필요합니다.") => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError(messageText);
        return null;
      }
      return accessToken;
    },
    [getAccessToken, setError],
  );

  return {
    supabase,
    getAccessToken,
    requireAccessToken,
  };
}
