import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEmotionNoteFlow } from "@/lib/api/flow/getEmotionNoteFlow";
import { queryKeys } from "@/lib/queryKeys";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";

type AccessContext = {
  mode: "auth" | "guest" | "blocked";
  accessToken: string | null;
};

type UseDeepSessionNotesParams = {
  mainIdParam: string;
  flowIdParam: string;
  subIdsParam: string;
  accessMode: AccessContext["mode"];
  accessToken: string | null;
};

const parseIds = (value: string | null) => {
  if (!value) return [] as number[];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

export function useDeepSessionNotes({
  mainIdParam,
  flowIdParam,
  subIdsParam,
  accessMode,
  accessToken,
}: UseDeepSessionNotesParams) {
  const mainId = useMemo(
    () => (mainIdParam ? Number(mainIdParam) : Number.NaN),
    [mainIdParam],
  );
  const flowId = useMemo(() => {
    const parsed = flowIdParam ? Number(flowIdParam) : null;
    return parsed !== null && Number.isFinite(parsed) ? parsed : null;
  }, [flowIdParam]);
  const subIds = useMemo(() => parseIds(subIdsParam), [subIdsParam]);
  const subIdSet = useMemo(() => new Set(subIds), [subIds]);
  const hasSubIdsParam = Boolean(subIdsParam);

  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [mainNote, setMainNote] = useState<EmotionNote | null>(null);
  const [subNotes, setSubNotes] = useState<EmotionNote[]>([]);
  const [flowNotes, setFlowNotes] = useState<EmotionNote[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([]);
  const [shouldSelectSubNotes, setShouldSelectSubNotes] = useState(false);

  const hasValidMainId = Number.isFinite(mainId) && !Number.isNaN(mainId);
  const invalidFlowId = Boolean(flowIdParam && flowId === null);
  const missingFlowId = !flowId;
  const invalidSubIds = Boolean(
    flowId && hasSubIdsParam && (subIds.length < 1 || subIds.length > 2),
  );

  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  const flowQuery = useQuery({
    queryKey:
      flowId && accessMode !== "blocked"
        ? queryKeys.flow.flow(access, flowId, false)
        : ["noop"],
    queryFn: async () => {
      const { response, data } = await fetchEmotionNoteFlow(
        access,
        flowId as number,
        {
          includeMiddles: false,
        },
      );
      if (!response.ok) {
        throw new Error("emotion_flow fetch failed");
      }
      return data.notes ?? [];
    },
    enabled:
      Boolean(flowId) &&
      accessMode !== "blocked" &&
      hasValidMainId &&
      !invalidFlowId &&
      !invalidSubIds,
  });

  useEffect(() => {
    setSelectedSubIds([]);
  }, [flowIdParam, mainIdParam]);

  useEffect(() => {
    if (!hasValidMainId) {
      setNotesError("mainId가 필요합니다.");
      setNotesLoading(false);
      return;
    }

    if (invalidFlowId) {
      setNotesError("flowId가 올바르지 않습니다.");
      setNotesLoading(false);
      return;
    }

    if (missingFlowId) {
      setNotesError("flowId가 필요합니다.");
      setNotesLoading(false);
      return;
    }

    if (invalidSubIds) {
      setNotesError("subIds는 1~2개여야 합니다.");
      setNotesLoading(false);
      return;
    }

    if (accessMode === "blocked") {
      return;
    }

    setNotesLoading(flowQuery.isPending || flowQuery.isFetching);
    if (flowQuery.isError) {
      setNotesError("노트를 불러오지 못했습니다.");
      return;
    }
    if (!flowQuery.data) return;
    const allNotes =
      flowQuery.data?.slice().sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      }) ?? [];
    const main = allNotes.find((note) => note.id === mainId) ?? null;
    const subs = allNotes
      .filter((note) => subIdSet.has(note.id))
      .sort((a, b) => b.id - a.id);

    if (!main) {
      setNotesError("메인 노트를 찾지 못했습니다.");
      setNotesLoading(false);
      return;
    }

    setNotesError(null);
    setMainNote(main);
    setSubNotes(subs);
    setFlowNotes(allNotes);
    setNotesLoading(false);
  }, [
    accessMode,
    flowQuery.data,
    flowQuery.isError,
    flowQuery.isFetching,
    flowQuery.isPending,
    hasValidMainId,
    invalidFlowId,
    invalidSubIds,
    mainId,
    missingFlowId,
    subIdSet,
  ]);

  const selectionRequired = useMemo(() => {
    if (!flowId) return false;
    if (notesLoading) return false;
    if (!mainNote) return false;
    if (hasSubIdsParam) return false;
    return flowNotes.some((note) => note.id !== mainNote.id);
  }, [flowId, flowNotes, hasSubIdsParam, mainNote, notesLoading]);

  useEffect(() => {
    setShouldSelectSubNotes(selectionRequired);
  }, [selectionRequired]);

  const selectableNotes = useMemo(() => {
    if (!flowId || !mainNote) return [];
    return flowNotes.filter((note) => note.id !== mainNote.id);
  }, [flowNotes, flowId, mainNote]);

  const toggleSelectSub = useCallback((id: number) => {
    setSelectedSubIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const selectedCount = selectedSubIds.length;
  const canConfirmSelection = selectedCount >= 1;

  const confirmSelection = useCallback(() => {
    if (!canConfirmSelection) return [] as EmotionNote[];
    const selectedNotes = flowNotes
      .filter((note) => selectedSubIds.includes(note.id))
      .sort((a, b) => b.id - a.id);
    setSubNotes(selectedNotes);
    return selectedNotes;
  }, [canConfirmSelection, flowNotes, selectedSubIds]);

  return {
    mainId,
    flowId,
    subIds,
    hasSubIdsParam,
    notesLoading,
    notesError,
    mainNote,
    subNotes,
    flowNotes,
    shouldSelectSubNotes,
    selectionRequired,
    selectableNotes,
    selectedSubIds,
    selectedCount,
    canConfirmSelection,
    toggleSelectSub,
    confirmSelection,
  };
}
