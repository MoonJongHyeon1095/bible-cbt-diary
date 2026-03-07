"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { queryKeys } from "@/lib/queryKeys";
import { mergeDeviceData } from "@/lib/api/device-merge/postDeviceMerge";
import { checkDeviceData } from "@/lib/api/device-merge/checkDeviceData";

type GuestMigrationState = {
  isPromptOpen: boolean;
  isUploading: boolean;
  error: string | null;
};

export const useGuestMigration = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const checkSeqRef = useRef(0);
  const lastCheckedAccessTokenRef = useRef<string | null>(null);

  const checkMigrationCandidate = useCallback(async (accessToken: string) => {
    const prevAccessToken = accessTokenRef.current;
    if (prevAccessToken && prevAccessToken !== accessToken) {
      mergingRef.current = false;
      mergedRef.current = false;
      declinedRef.current = false;
      setState((prev) => ({
        ...prev,
        isPromptOpen: false,
        isUploading: false,
        error: null,
      }));
    }
    accessTokenRef.current = accessToken;
    if (lastCheckedAccessTokenRef.current === accessToken) {
      return;
    }
    if (mergingRef.current || mergedRef.current || declinedRef.current) {
      return;
    }
    const seq = ++checkSeqRef.current;
    const result = await checkDeviceData(accessToken);
    if (seq !== checkSeqRef.current) return;
    if (mergingRef.current || mergedRef.current || declinedRef.current) {
      return;
    }
    if (!result.response.ok) {
      return;
    }
    lastCheckedAccessTokenRef.current = accessToken;
    if (!result.data?.hasData) {
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
      setState((prev) => ({
        ...prev,
        isPromptOpen: false,
        isUploading: false,
        error: null,
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all }),
        queryClient.invalidateQueries({ queryKey: ["emotion-behavior-details"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sessionHistory.all }),
      ]);
      pushToast("기기 기록을 회원 기록으로 이전했습니다.", "success");
      router.refresh();
      mergingRef.current = false;
      return;
    }

    mergingRef.current = false;
    mergedRef.current = false;
    setState((prev) => ({
      ...prev,
      isPromptOpen: true,
      isUploading: false,
      error: "이전에 실패했습니다. 잠시 후 다시 시도해주세요.",
    }));
    pushToast("이전에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
  }, [pushToast, queryClient, router]);

  const declineMigration = useCallback(() => {
    declinedRef.current = true;
    setState((prev) => ({ ...prev, isPromptOpen: false }));
  }, []);

  const confirmMigration = useCallback(async () => {
    await runMerge();
  }, [runMerge]);

  return {
    isPromptOpen: state.isPromptOpen,
    isUploading: state.isUploading,
    error: state.error,
    checkMigrationCandidate,
    confirmMigration,
    declineMigration,
  };
};
