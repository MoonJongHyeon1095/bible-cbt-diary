"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import SafeButton from "@/components/ui/SafeButton";
import { deleteEmotionNoteFlowNote } from "@/lib/api/flow/deleteEmotionNoteFlowNote";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookSearch,
  Download,
  LayoutDashboard,
  Route,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import EmotionNoteFlowCanvas from "./EmotionNoteFlowCanvas";
import EmotionNoteFlowDetailStack from "./EmotionNoteFlowDetailStack";
import EmotionNoteFlowImportModal from "./EmotionNoteFlowImportModal";
import styles from "./EmotionNoteFlowSection.module.css";
import { useEmotionNoteFlowData } from "./hooks/useEmotionNoteFlowData";
import { useEmotionNoteFlowDisplay } from "./hooks/useEmotionNoteFlowDisplay";
import { useEmotionNoteFlowLayout } from "./hooks/useEmotionNoteFlowLayout";
import { useEmotionNoteFlowSelection } from "./hooks/useEmotionNoteFlowSelection";
import { getFlowThemeColor } from "./utils/flowColors";
import EmotionNoteFlowMontageModal from "./EmotionNoteFlowMontageModal";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";

// Props for the flow detail section.
type EmotionNoteFlowSectionProps = {
  access: AccessContext;
  noteId: number | null;
  flowId: number | null;
};

export default function EmotionNoteFlowSection({
  access,
  noteId,
  flowId,
}: EmotionNoteFlowSectionProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();
  // Usage guard for deep-session entry.
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  // Load notes/middles either by flow or single note.
  const { notes, middles, montages, isLoading } = useEmotionNoteFlowData({
    access,
    flowId,
  });
  // Theme color derived from flow id (if present).
  const themeColor = useMemo(
    () => (flowId ? getFlowThemeColor(flowId).rgb : undefined),
    [flowId],
  );
  // Layout: compute positioned nodes/edges + axis data.
  const { elkNodes, elkEdges, axisLabels, axisY } = useEmotionNoteFlowLayout(
    notes,
    middles,
    themeColor,
  );
  // Selection state for active node.
  const { selectedNodeId, selectedNote, clearSelection, selectNode } =
    useEmotionNoteFlowSelection(notes);
  // Derive display nodes/edges with selection styling.
  const [activeMontage, setActiveMontage] = useState<EmotionMontage | null>(
    null,
  );
  const montageByNoteId = useMemo(() => {
    const map = new Map<string, EmotionMontage[]>();
    const compareMontage = (left: EmotionMontage, right: EmotionMontage) => {
      const leftStamp = left.created_at ?? "";
      const rightStamp = right.created_at ?? "";
      if (leftStamp && rightStamp && leftStamp !== rightStamp) {
        return rightStamp.localeCompare(leftStamp);
      }
      if (leftStamp && !rightStamp) return -1;
      if (!leftStamp && rightStamp) return 1;
      return right.id - left.id;
    };
    montages.forEach((montage) => {
      const rawIds = [montage.main_note_id, ...(montage.sub_note_ids ?? [])];
      const ids = rawIds.filter((id) => Number.isFinite(id));
      if (ids.length === 0) return;
      const targetId = Math.max(...ids);
      const key = String(targetId);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, [montage]);
        return;
      }
      existing.push(montage);
    });
    map.forEach((list, key) => {
      map.set(key, [...list].sort(compareMontage));
    });
    return map;
  }, [montages]);
  const { displayNodes, displayEdges } = useEmotionNoteFlowDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
    {
      montageByNoteId,
      onOpenMontage: setActiveMontage,
    },
  );
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [autoCenterNodeId, setAutoCenterNodeId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useModalOpen(confirmDelete || Boolean(activeMontage));
  // Navigate into deep session with usage guard and optional flow context.
  const handleGoDeeper = async () => {
    if (!selectedNote) return;
    setIsGoDeeperLoading(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
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
    router.push(`/session/deep?mainId=${selectedNote.id}&flowId=${flowId}`);
  };
  // Stable key forces ReactFlow to re-mount when layout changes.
  const layoutKey = useMemo(() => {
    const nodeKey = elkNodes.map((node) => node.id).join("|");
    const edgeKey = elkEdges.map((edge) => edge.id).join("|");
    return `${nodeKey}-${edgeKey}`;
  }, [elkEdges, elkNodes]);

  const emptyState = !isLoading && notes.length === 0;
  const needsNote = !isLoading && !noteId && !flowId;
  const noteCount = notes.length;
  const handleDeleteNote = async () => {
    if (!selectedNote || !flowId) return false;
    if (access.mode === "blocked") {
      pushToast("플로우를 삭제할 수 없습니다.", "error");
      return false;
    }
    setIsDeleting(true);
    const { response, data } = await deleteEmotionNoteFlowNote(access, {
      flow_id: flowId,
      note_id: selectedNote.id,
    });
    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(
        data.message ?? "플로우에서 기록을 삭제하지 못했습니다.",
        "error",
      );
      return false;
    }
    queryClient.setQueriesData(
      { queryKey: ["emotion-flow", "flows"], type: "all" },
      (prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((flow) =>
          flow.id === flowId
            ? { ...flow, note_count: Math.max(0, (flow.note_count ?? 0) - 1) }
            : flow,
        );
      },
    );
    await queryClient.invalidateQueries({
      queryKey: queryKeys.flow.flow(access, flowId, true),
    });
    await queryClient.invalidateQueries({
      queryKey: ["emotion-flow", "flows"],
    });
    pushToast("플로우에서 기록을 삭제했습니다.", "success");
    clearSelection();
    setConfirmDelete(false);
    setIsDeleting(false);
    return true;
  };

  // Toggle selection on node click.
  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId === nodeId) {
      clearSelection();
      return;
    }
    selectNode(nodeId);
  };

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

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          {/* Header shows note count in the current flow. */}
          <h2 className={styles.title}>{noteCount}개의 감정 기록이 있습니다</h2>
        </div>
        {/* Back to flow overview. */}
        <SafeButton
          type="button"
          variant="ghost"
          onClick={() => router.push("/flow")}
        >
          <LayoutDashboard size={18} />
          노트 플로우 목록보기
        </SafeButton>
      </div>
      {/* ReactFlow canvas + overlays. */}
      <EmotionNoteFlowCanvas
        flowKey={layoutKey}
        displayNodes={displayNodes}
        displayEdges={displayEdges}
        axisLabels={axisLabels}
        axisY={axisY}
        isLoading={isLoading}
        needsNote={needsNote}
        emptyState={emptyState}
        autoCenterNodeId={autoCenterNodeId}
        onClearSelection={clearSelection}
        onSelectNode={handleNodeClick}
      >
        {selectedNote ? (
          <>
            {/* Quick access to detail view. */}
            <FloatingActionButton
              label="삭제"
              helperText="삭제"
              icon={<Trash2 size={20} />}
              className={styles.fabPrimary}
              onClick={() => setConfirmDelete(true)}
              style={{
                backgroundColor: "#e14a4a",
                color: "#fff",
                borderColor: "#b93333",
              }}
            />
            <FloatingActionButton
              label="상세조회"
              helperText="상세조회"
              icon={<BookSearch size={20} />}
              className={styles.fabSecondary}
              onClick={() => router.push(`/detail?id=${selectedNote.id}`)}
            />
            {/* Enter deep session. */}
            <FloatingActionButton
              label="Go Deeper"
              helperText="Go Deeper"
              icon={<Route size={20} />}
              className={`${styles.deepFab} ${styles.fabTertiary}`}
              onClick={async () => {
                if (access.mode === "blocked") {
                  pushToast("플로우를 시작할 수 없습니다.", "error");
                  return;
                }
                await handleGoDeeper();
              }}
              loadingRing={isGoDeeperLoading}
              style={{
                backgroundColor: "#121417",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.35)",
              }}
            />
          </>
        ) : flowId ? (
          <FloatingActionButton
            label="Import"
            helperText="Import"
            icon={<Download size={20} />}
            className={styles.fabPrimary}
            onClick={() => setIsImportOpen(true)}
          />
        ) : null}
        {selectedNote ? (
          <div className={styles.detailStackWrap}>
            <EmotionNoteFlowDetailStack selectedNote={selectedNote} />
          </div>
        ) : null}
      </EmotionNoteFlowCanvas>
      {confirmDelete && selectedNote ? (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className={styles.confirmCard}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.confirmTitle}>
              이 기록을 플로우에서 삭제할까요?
            </p>
            <p className={styles.confirmBody}>
              해당 기록은 다른 플로우나 기록 목록에서는 유지됩니다.
            </p>
            <div className={styles.confirmActions}>
              <SafeButton
                variant="danger"
                onClick={handleDeleteNote}
                loading={isDeleting}
                loadingText="삭제 중..."
                disabled={isDeleting}
              >
                삭제
              </SafeButton>
              <SafeButton
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                취소
              </SafeButton>
            </div>
          </div>
        </div>
      ) : null}
      {activeMontage ? (
        <EmotionNoteFlowMontageModal
          montage={activeMontage}
          onClose={() => setActiveMontage(null)}
        />
      ) : null}
      {flowId ? (
        <EmotionNoteFlowImportModal
          open={isImportOpen}
          access={access}
          flowId={flowId}
          onClose={() => setIsImportOpen(false)}
          onImported={(noteId) => setAutoCenterNodeId(String(noteId))}
        />
      ) : null}
    </section>
  );
}
