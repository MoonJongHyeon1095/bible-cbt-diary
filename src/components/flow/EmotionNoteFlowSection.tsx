"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import SafeButton from "@/components/ui/SafeButton";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { BookSearch, LayoutDashboard, Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import EmotionNoteFlowCanvas from "./EmotionNoteFlowCanvas";
import EmotionNoteFlowDetailStack from "./EmotionNoteFlowDetailStack";
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
  // Usage guard for deep-session entry.
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });
  // Load notes/middles either by flow or single note.
  const { notes, middles, isLoading } = useEmotionNoteFlowData({
    accessToken,
    flowId,
    noteId,
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
  const {
    selectedNodeId,
    selectedNote,
    clearSelection,
    selectNode,
    toggleSelection,
  } = useEmotionNoteFlowSelection(notes);
  // Derive display nodes/edges with selection styling.
  const { displayNodes, displayEdges } = useEmotionNoteFlowDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
  );
  const [isGoDeeperLoading, setIsGoDeeperLoading] = useState(false);
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
    const query = flowId
      ? `/session/deep?mainId=${selectedNote.id}&flowId=${flowId}`
      : `/session/deep?mainId=${selectedNote.id}`;
    router.push(query);
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

  // Toggle selection on node click.
  const handleNodeClick = (nodeId: string) => {
    toggleSelection(nodeId);
  };

  // Auto-select node when a specific noteId is provided.
  useEffect(() => {
    if (!noteId) return;
    const nodeId = String(noteId);
    if (notes.some((note) => String(note.id) === nodeId)) {
      selectNode(nodeId);
    }
  }, [noteId, notes, selectNode]);

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
        onClearSelection={clearSelection}
        onSelectNode={handleNodeClick}
      >
        {selectedNote ? (
          <>
            {/* Quick access to detail view. */}
            <FloatingActionButton
              label="상세조회"
              helperText="상세조회"
              icon={<BookSearch size={20} />}
              onClick={() => router.push(`/detail?id=${selectedNote.id}`)}
            />
            {/* Enter deep session. */}
            <FloatingActionButton
              label="Go Deeper"
              helperText="Go Deeper"
              icon={<Route size={20} />}
              className={styles.deepFab}
              onClick={handleGoDeeper}
              loadingRing={isGoDeeperLoading}
            />
          </>
        ) : null}
        {selectedNote ? (
          <div className={styles.detailStackWrap}>
            <EmotionNoteFlowDetailStack selectedNote={selectedNote} />
          </div>
        ) : null}
      </EmotionNoteFlowCanvas>
    </section>
  );
}
