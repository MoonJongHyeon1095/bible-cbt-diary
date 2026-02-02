"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import {
  clearGuestData,
  hasGuestData,
  uploadGuestData,
} from "@/lib/utils/guestStorage";

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
  const promptedRef = useRef(false);
  const uploadingRef = useRef(false);

  const openPromptIfNeeded = useCallback((accessToken: string | null) => {
    if (!accessToken) return;
    if (promptedRef.current) return;
    if (!hasGuestData()) return;
    accessTokenRef.current = accessToken;
    promptedRef.current = true;
    setState((prev) => ({
      ...prev,
      isPromptOpen: true,
      error: null,
    }));
  }, []);

  useEffect(() => {
    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      openPromptIfNeeded(data.session?.access_token ?? null);
    };

    resolveSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.access_token) {
          accessTokenRef.current = null;
          promptedRef.current = false;
          uploadingRef.current = false;
          setState((prev) => ({
            ...prev,
            isPromptOpen: false,
            isUploading: false,
          }));
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          openPromptIfNeeded(session.access_token);
        }
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, [openPromptIfNeeded, supabase]);

  const declineMigration = useCallback(() => {
    setState((prev) => ({ ...prev, isPromptOpen: false }));
  }, []);

  const confirmMigration = useCallback(async () => {
    if (uploadingRef.current) return;
    const accessToken = accessTokenRef.current;
    if (!accessToken) return;
    uploadingRef.current = true;
    setState((prev) => ({ ...prev, isUploading: true, error: null }));

    const result = await uploadGuestData(accessToken);
    if (result.ok) {
      clearGuestData();
      setState((prev) => ({ ...prev, isPromptOpen: false, isUploading: false }));
      uploadingRef.current = false;
      pushToast("기기 기록을 회원 기록으로 이전했습니다.", "success");
      router.refresh();
      return;
    }

    uploadingRef.current = false;
    setState((prev) => ({
      ...prev,
      isUploading: false,
      isPromptOpen: false,
      error: null,
    }));
    promptedRef.current = false;
    pushToast("이전에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
  }, [pushToast, router]);

  return {
    isPromptOpen: state.isPromptOpen,
    isUploading: state.isUploading,
    error: state.error,
    confirmMigration,
    declineMigration,
  };
};
