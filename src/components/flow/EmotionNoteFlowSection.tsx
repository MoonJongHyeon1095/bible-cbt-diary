"use client";

import { useCbtToast } from "@/components/cbt/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import SafeButton from "@/components/ui/SafeButton";
import { deleteEmotionNoteFlowNote } from "@/lib/api/flow/deleteEmotionNoteFlowNote";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { queryKeys } from "@/lib/queryKeys";
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

// Props for the flow detail section.
type EmotionNoteFlowSectionProps = {
  accessToken: string;
  noteId: number | null;
  flowId: number | null;
};

export default function EmotionNoteFlowSection({
  accessToken,
  noteId,
  flowId,
}: EmotionNoteFlowSectionProps) {
  const router = useRouter();
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();
  // Usage guard for deep-session entry.
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  // Load notes/middles either by flow or single note.
  const { notes, middles, isLoading } = useEmotionNoteFlowData({
    accessToken,
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
  const { displayNodes, displayEdges } = useEmotionNoteFlowDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
  );
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState<number | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useModalOpen(confirmDelete);
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
  const access = useMemo(
    () => ({ mode: "auth" as const, accessToken }),
    [accessToken],
  );

  const handleDeleteNote = async () => {
    if (!selectedNote || !flowId) return false;
    if (!access.accessToken) {
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
    await queryClient.invalidateQueries({
      queryKey: queryKeys.flow.flow(access.accessToken, flowId, true),
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
    setFocusNodeId(nodeId);
    setFocusToken((prev) => prev + 1);
  };

  // Auto-select node when a specific noteId is provided.
  useEffect(() => {
    if (!noteId) return;
    const nodeId = String(noteId);
    if (notes.some((note) => String(note.id) === nodeId)) {
      selectNode(nodeId);
      setFocusNodeId(nodeId);
      setFocusToken((prev) => prev + 1);
    }
  }, [noteId, notes, selectNode]);

  useEffect(() => {
    if (!selectedNote) {
      setConfirmDelete(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (!pendingSelectId) return;
    const pendingId = String(pendingSelectId);
    if (notes.some((note) => String(note.id) === pendingId)) {
      selectNode(pendingId);
      setPendingSelectId(null);
      setFocusNodeId(pendingId);
      setFocusToken((prev) => prev + 1);
    }
  }, [notes, pendingSelectId, selectNode]);

  useEffect(() => {
    if (!focusNodeId || !selectedNodeId) return;
    if (focusNodeId !== selectedNodeId) {
      setFocusNodeId(null);
    }
  }, [focusNodeId, selectedNodeId]);

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
        selectedNodeId={selectedNodeId}
        focusNodeId={focusNodeId}
        focusToken={focusToken}
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
              onClick={handleGoDeeper}
              loadingRing={isGoDeeperLoading}
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
      {flowId ? (
        <EmotionNoteFlowImportModal
          open={isImportOpen}
          access={access}
          flowId={flowId}
          onClose={() => setIsImportOpen(false)}
          onImported={(noteId) => setPendingSelectId(noteId)}
        />
      ) : null}
    </section>
  );
}
