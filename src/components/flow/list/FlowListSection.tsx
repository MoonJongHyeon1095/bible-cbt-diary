"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import { deleteEmotionFlow } from "@/lib/api/flow/deleteEmotionFlow";
import { patchEmotionNoteFlowMeta } from "@/lib/api/flow/patchEmotionNoteFlowMeta";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flowRoutes } from "../domain/navigation/flowRoutes";
import { invalidateFlowListQueries } from "../domain/query/flowQueryClient";
import { getFlowThemeColor } from "../utils/flowColors";
import { useFlowListQuery } from "./hooks/useFlowListQuery";
import type { FlowListNodeViewModel } from "./nodes/FlowListNode";
import FlowListSectionView from "./views/FlowListSectionView";

const META_TITLE_PLACEHOLDER = "플로우 제목";
const META_DESCRIPTION_PLACEHOLDER = "플로우 설명";
const INVALID_META_TITLE_VALUES = new Set([
  "",
  META_TITLE_PLACEHOLDER,
  "제목을 입력해주세요",
  "제목 없는 플로우",
]);
const INVALID_META_DESCRIPTION_VALUES = new Set([
  "",
  META_DESCRIPTION_PLACEHOLDER,
  "설명을 입력해주세요",
  "설명이 아직 없습니다.",
]);

const normalizeMetaTitle = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  return INVALID_META_TITLE_VALUES.has(text) ? "" : text;
};

const normalizeMetaDescription = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  return INVALID_META_DESCRIPTION_VALUES.has(text) ? "" : text;
};

type FlowListSectionProps = {
  access: AccessContext;
  noteId?: number | null;
};

type FlowSummary = {
  id: number;
  created_at: string;
  note_count: number;
  title: string;
  description: string | null;
};

type FlowNodeBase = {
  id: number;
  noteCount: number;
  title: string;
  description: string | null;
  radius: number;
  color: string;
  rgb: [number, number, number];
};

type FlowSortMode = "latest" | "size";

const sortFlows = (flows: FlowSummary[], mode: FlowSortMode) => {
  const byDateDesc = (a: FlowSummary, b: FlowSummary) => {
    const aTime = Number.isFinite(Date.parse(a.created_at))
      ? Date.parse(a.created_at)
      : 0;
    const bTime = Number.isFinite(Date.parse(b.created_at))
      ? Date.parse(b.created_at)
      : 0;
    return bTime - aTime || b.id - a.id;
  };

  return [...flows].sort((a, b) => {
    if (mode === "size") {
      return b.note_count - a.note_count || byDateDesc(a, b);
    }
    return byDateDesc(a, b);
  });
};

const buildNodes = (flows: FlowSummary[]): FlowNodeBase[] => {
  const minRadius = 42 + Math.min(72, 2 * 5);
  return flows.map((flow) => {
    const radius = Math.max(minRadius, 42 + Math.min(72, flow.note_count * 5));
    const theme = getFlowThemeColor(flow.id);
    return {
      id: flow.id,
      noteCount: flow.note_count,
      title: flow.title ?? "",
      description: flow.description ?? null,
      radius,
      color: theme.rgbString,
      rgb: theme.rgb,
    };
  });
};

export default function FlowListSection({
  access,
  noteId = null,
}: FlowListSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();

  const [sortMode, setSortMode] = useState<FlowSortMode>("latest");
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMetaEditing, setIsMetaEditing] = useState(false);
  const [metaTitleDraft, setMetaTitleDraft] = useState("");
  const [metaDescriptionDraft, setMetaDescriptionDraft] = useState("");
  const [isMetaSaving, setIsMetaSaving] = useState(false);

  useModalOpen(confirmDelete);

  const flowsQuery = useFlowListQuery(access, noteId);
  const isLoading = flowsQuery.isPending;
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);
  const sortedFlows = useMemo(
    () => sortFlows(flows, sortMode),
    [flows, sortMode],
  );
  const baseNodes = useMemo(() => buildNodes(sortedFlows), [sortedFlows]);

  const filterNoteQuery = useQuery({
    queryKey:
      noteId && access.mode !== "blocked"
        ? queryKeys.emotionNotes.detail(access, noteId)
        : ["flow-note-filter", "noop"],
    queryFn: async () => {
      if (!noteId) return null;
      const { response, data } = await fetchEmotionNote(noteId, access);
      if (!response.ok) {
        throw new Error("note filter context fetch failed");
      }
      return data.note;
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
    staleTime: 60_000,
  });

  const filterNoteTitle = useMemo(
    () => filterNoteQuery.data?.title?.trim() || null,
    [filterNoteQuery.data?.title],
  );

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) ?? null,
    [flows, selectedFlowId],
  );

  const startMetaEdit = useCallback(() => {
    if (!selectedFlow) return;
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow.description));
    setIsMetaEditing(true);
  }, [selectedFlow]);

  const cancelMetaEdit = useCallback(() => {
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow?.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow?.description));
    setIsMetaEditing(false);
  }, [selectedFlow]);

  const saveMeta = useCallback(async () => {
    if (!selectedFlowId) return;
    if (access.mode === "blocked") {
      pushToast("플로우를 수정할 수 없습니다.", "error");
      return;
    }

    const nextTitle = normalizeMetaTitle(metaTitleDraft).slice(0, 40);
    const nextDescription = normalizeMetaDescription(metaDescriptionDraft).slice(0, 40);
    if (!nextTitle) {
      pushToast("플로우 제목을 입력해주세요.", "error");
      return;
    }

    setIsMetaSaving(true);
    const { response, data } = await patchEmotionNoteFlowMeta(access, {
      flow_id: selectedFlowId,
      title: nextTitle,
      description: nextDescription.length > 0 ? nextDescription : null,
    });

    if (!response.ok || !data.ok) {
      setIsMetaSaving(false);
      pushToast(data.message ?? "플로우 정보를 저장하지 못했습니다.", "error");
      return;
    }

    await invalidateFlowListQueries(queryClient, access);
    setIsMetaEditing(false);
    setIsMetaSaving(false);
    pushToast("플로우 정보를 저장했습니다.", "success");
  }, [
    access,
    metaDescriptionDraft,
    metaTitleDraft,
    pushToast,
    queryClient,
    selectedFlowId,
  ]);

  const displayNodes = useMemo<FlowListNodeViewModel[]>(
    () =>
      baseNodes.map((node) => {
        const isSelected = selectedFlowId === node.id;
        return {
          ...node,
          selected: isSelected,
          isMetaEditing: isSelected && isMetaEditing,
          isMetaSaving: isSelected && isMetaSaving,
          metaTitleDraft: isSelected ? metaTitleDraft : "",
          metaDescriptionDraft: isSelected ? metaDescriptionDraft : "",
          onSelect: () => setSelectedFlowId(node.id),
          onStartMetaEdit: startMetaEdit,
          onCancelMetaEdit: cancelMetaEdit,
          onSaveMeta: saveMeta,
          onChangeMetaTitle: (value: string) => setMetaTitleDraft(value.slice(0, 40)),
          onChangeMetaDescription: (value: string) =>
            setMetaDescriptionDraft(value.slice(0, 40)),
        };
      }),
    [
      baseNodes,
      cancelMetaEdit,
      isMetaEditing,
      isMetaSaving,
      metaDescriptionDraft,
      metaTitleDraft,
      saveMeta,
      selectedFlowId,
      startMetaEdit,
    ],
  );

  useEffect(() => {
    if (selectedFlowId && !flows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(null);
    }
  }, [flows, selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId) {
      setConfirmDelete(false);
      setIsMetaEditing(false);
      setMetaTitleDraft("");
      setMetaDescriptionDraft("");
    }
  }, [selectedFlowId]);

  useEffect(() => {
    if (!selectedFlow || isMetaEditing) {
      return;
    }
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow.description));
  }, [isMetaEditing, selectedFlow]);

  const totalCount = useMemo(
    () => baseNodes.reduce((sum, node) => sum + node.noteCount, 0),
    [baseNodes],
  );

  const handleDeleteFlow = async () => {
    if (!selectedFlowId) return;
    setIsDeleting(true);
    const { response, data } = await deleteEmotionFlow(access, {
      flow_id: selectedFlowId,
    });

    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(data.message ?? "플로우를 삭제하지 못했습니다.", "error");
      return;
    }

    await invalidateFlowListQueries(queryClient, access);
    setConfirmDelete(false);
    setSelectedFlowId(null);
    setIsDeleting(false);
    pushToast("플로우를 삭제했습니다.", "success");
  };

  return (
    <FlowListSectionView
      isLoading={isLoading}
      nodes={displayNodes}
      selectedFlow={selectedFlow}
      totalCount={totalCount}
      sortMode={sortMode}
      onChangeSortMode={setSortMode}
      onSelectFlow={setSelectedFlowId}
      filterNoteId={noteId}
      filterNoteTitle={filterNoteTitle}
      isFilterNoteLoading={filterNoteQuery.isPending || filterNoteQuery.isFetching}
      confirmDelete={confirmDelete}
      isDeleting={isDeleting}
      onOpenDeleteConfirm={() => setConfirmDelete(true)}
      onCloseDeleteConfirm={() => setConfirmDelete(false)}
      onDeleteFlow={handleDeleteFlow}
      onOpenFlow={(selectedId) => router.push(flowRoutes.byFlow(selectedId))}
    />
  );
}
