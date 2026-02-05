"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { mergeDeviceData } from "@/lib/api/device-merge/postDeviceMerge";
import { checkDeviceData } from "@/lib/api/device-merge/checkDeviceData";

type GuestMigrationState = {
  isPromptOpen: boolean;
  isUploading: boolean;
  error: string | null;
};

export const useGuestMigration = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const [state, setState] = useState<GuestMigrationState>({
    isPromptOpen: false,
    isUploading: false,
    error: null,
  });
  const accessTokenRef = useRef<string | null>(null);
  const mergingRef = useRef(false);
  const mergedRef = useRef(false);
  const declinedRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (mergingRef.current || mergedRef.current || declinedRef.current) {
      return;
    }
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;

    const result = await checkDeviceData(accessToken);
    if (!result.response.ok || !result.data?.hasData) {
      return;
    }

    setState((prev) => ({ ...prev, isPromptOpen: true, error: null }));
  }, []);

  const runMerge = useCallback(async () => {
    if (mergingRef.current || mergedRef.current) return;
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;

    mergingRef.current = true;
    setState((prev) => ({ ...prev, isUploading: true, error: null }));

    const result = await mergeDeviceData(accessToken);
    if (result.response.ok) {
      mergedRef.current = true;
      setState((prev) => ({ ...prev, isUploading: false, error: null }));
      pushToast("기기 기록을 회원 기록으로 이전했습니다.", "success");
      router.refresh();
      mergingRef.current = false;
      return;
    }

    mergingRef.current = false;
    mergedRef.current = false;
    setState((prev) => ({ ...prev, isUploading: false, error: null }));
    pushToast("이전에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
  }, [pushToast, router]);

  useEffect(() => {
    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      accessTokenRef.current = data.session?.access_token ?? null;
      if (accessTokenRef.current) {
        runCheck();
      }
    };

    resolveSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.access_token) {
          accessTokenRef.current = null;
          mergedRef.current = false;
          mergingRef.current = false;
          declinedRef.current = false;
          setState((prev) => ({
            ...prev,
            isPromptOpen: false,
            isUploading: false,
          }));
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          accessTokenRef.current = session.access_token;
          runCheck();
        }
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, [runCheck, supabase]);

  const declineMigration = useCallback(() => {
    declinedRef.current = true;
    setState((prev) => ({ ...prev, isPromptOpen: false }));
  }, []);

  const confirmMigration = useCallback(async () => {
    setState((prev) => ({ ...prev, isPromptOpen: false }));
    await runMerge();
  }, [runMerge]);

  return {
    isPromptOpen: state.isPromptOpen,
    isUploading: state.isUploading,
    error: state.error,
    confirmMigration,
    declineMigration,
  };
};
