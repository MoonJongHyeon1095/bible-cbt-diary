"use client";

import { useCbtToast } from "@/components/session/common/CbtToast";
import { useModalOpen } from "@/components/common/useModalOpen";
import { deleteEmotionNoteFlowNote } from "@/lib/api/flow/deleteEmotionNoteFlowNote";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { mapMontagesByTargetNoteId } from "./domain/montage/mapMontagesByTargetNoteId";
import { flowRoutes } from "../domain/navigation/flowRoutes";
import {
  invalidateFlowDetailQuery,
  invalidateFlowListQueries,
  patchFlowCountAcrossLists,
} from "../domain/query/flowQueryClient";
import { getFlowThemeColor } from "../utils/flowColors";
import { useFlowDetailData } from "./hooks/useFlowDetailData";
import { useFlowDetailDisplay } from "./hooks/useFlowDetailDisplay";
import { useFlowDetailLayout } from "./hooks/useFlowDetailLayout";
import { useFlowDetailSelection } from "./hooks/useFlowDetailSelection";
import FlowDetailSectionView from "./views/FlowDetailSectionView";

type FlowDetailSectionProps = {
  access: AccessContext;
  noteId: number | null;
  flowId: number | null;
};

export default function FlowDetailSection({
  access,
  noteId,
  flowId,
}: FlowDetailSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const [activeMontage, setActiveMontage] = useState<EmotionMontage | null>(null);
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [autoCenterNodeId, setAutoCenterNodeId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { flow, notes, middles, montages, isLoading } = useFlowDetailData({
    access,
    flowId,
  });

  const themeColor = useMemo(
    () => (flowId ? getFlowThemeColor(flowId).rgb : undefined),
    [flowId],
  );

  const { elkNodes, elkEdges, axisLabels, axisY } = useFlowDetailLayout(
    notes,
    middles,
    themeColor,
  );

  const { selectedNodeId, selectedNote, clearSelection, selectNode } =
    useFlowDetailSelection(notes);

  const montageByNoteId = useMemo(
    () => mapMontagesByTargetNoteId(montages),
    [montages],
  );

  const { displayNodes, displayEdges } = useFlowDetailDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
    {
      montageByNoteId,
      onOpenMontage: setActiveMontage,
    },
  );

  const layoutKey = useMemo(() => {
    const nodeKey = elkNodes.map((node) => node.id).join("|");
    const edgeKey = elkEdges.map((edge) => edge.id).join("|");
    return `${nodeKey}-${edgeKey}`;
  }, [elkEdges, elkNodes]);

  const emptyState = !isLoading && notes.length === 0;
  const needsNote = !isLoading && !noteId && !flowId;
  const noteCount = notes.length;

  useModalOpen(confirmDelete || Boolean(activeMontage));

  useEffect(() => {
    if (!noteId) return;
    const nodeId = String(noteId);
    if (!notes.some((note) => String(note.id) === nodeId)) return;
    selectNode(nodeId);
    setAutoCenterNodeId(nodeId);
  }, [noteId, notes, selectNode]);

  useEffect(() => {
    if (!selectedNote) {
      setConfirmDelete(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    setActiveMontage(null);
  }, [flowId]);

  useEffect(() => {
    if (!autoCenterNodeId) return;
    if (!notes.some((note) => String(note.id) === autoCenterNodeId)) return;
    selectNode(autoCenterNodeId);
  }, [autoCenterNodeId, notes, selectNode]);

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId === nodeId) {
      clearSelection();
      return;
    }
    selectNode(nodeId);
  };

  const handleGoDeeper = async () => {
    if (!selectedNote) return;
    if (access.mode === "blocked") {
      pushToast("플로우를 시작할 수 없습니다.", "error");
      return;
    }

    setIsGoDeeperLoading(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const allowed = await checkUsage();
    if (!allowed) {
      setIsGoDeeperLoading(false);
      return;
    }

    if (!flowId) {
      pushToast("플로우 정보를 찾을 수 없습니다.", "error");
      setIsGoDeeperLoading(false);
      return;
    }

    router.push(flowRoutes.deepSession(selectedNote.id, flowId));
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !flowId) return;
    if (access.mode === "blocked") {
      pushToast("플로우를 삭제할 수 없습니다.", "error");
      return;
    }

    setIsDeleting(true);
    const { response, data } = await deleteEmotionNoteFlowNote(access, {
      flow_id: flowId,
      note_id: selectedNote.id,
    });

    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(data.message ?? "플로우에서 기록을 삭제하지 못했습니다.", "error");
      return;
    }

    patchFlowCountAcrossLists(queryClient, flowId, -1);
    await invalidateFlowDetailQuery(queryClient, access, flowId);
    await invalidateFlowListQueries(queryClient, access);

    pushToast("플로우에서 기록을 삭제했습니다.", "success");
    clearSelection();
    setConfirmDelete(false);
    setIsDeleting(false);
  };

  return (
    <FlowDetailSectionView
      access={access}
      flowId={flowId}
      flowTitle={flow?.title ?? null}
      flowDescription={flow?.description ?? null}
      noteCount={noteCount}
      displayNodes={displayNodes}
      displayEdges={displayEdges}
      axisLabels={axisLabels}
      axisY={axisY}
      isLoading={isLoading}
      needsNote={needsNote}
      emptyState={emptyState}
      autoCenterNodeId={autoCenterNodeId}
      selectedNote={selectedNote}
      activeMontage={activeMontage}
      isGoDeeperLoading={isGoDeeperLoading}
      isImportOpen={isImportOpen}
      confirmDelete={confirmDelete}
      isDeleting={isDeleting}
      layoutKey={layoutKey}
      onBackToList={() => router.push(flowRoutes.root())}
      onOpenDeleteConfirm={() => setConfirmDelete(true)}
      onCloseDeleteConfirm={() => setConfirmDelete(false)}
      onDeleteNote={handleDeleteNote}
      onOpenDetail={(selectedId) => router.push(flowRoutes.detail(selectedId))}
      onGoDeeper={handleGoDeeper}
      onOpenImport={() => setIsImportOpen(true)}
      onCloseImport={() => setIsImportOpen(false)}
      onImported={(importedNoteId) => setAutoCenterNodeId(String(importedNoteId))}
      onOpenMontage={setActiveMontage}
      onClearSelection={clearSelection}
      onSelectNode={handleNodeClick}
    />
  );
}
