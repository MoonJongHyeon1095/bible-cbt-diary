"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import Button from "@/components/ui/Button";
import { Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import EmotionGraphCanvas from "./EmotionGraphCanvas";
import EmotionGraphDeepOverlay from "./EmotionGraphDeepOverlay";
import EmotionGraphDetailStack from "./EmotionGraphDetailStack";
import styles from "./EmotionGraphSection.module.css";
import { useElkLayout } from "./hooks/useElkLayout";
import { useEmotionGraphData } from "./hooks/useEmotionGraphData";
import { useGraphDeepSelection } from "./hooks/useGraphDeepSelection";
import { useGraphDisplay } from "./hooks/useGraphDisplay";
import { useGraphSelection } from "./hooks/useGraphSelection";

type EmotionGraphSectionProps = {
  accessToken: string;
  noteId: number | null;
  groupId: number | null;
};

export default function EmotionGraphSection({
  accessToken,
  noteId,
  groupId,
}: EmotionGraphSectionProps) {
  const router = useRouter();
  const { notes, middles, isLoading } = useEmotionGraphData({
    accessToken,
    groupId,
    noteId,
  });
  const { elkNodes, elkEdges } = useElkLayout(notes, middles);
  const {
    selectedNodeId,
    selectedNote,
    sortedSelectableNotes,
    clearSelection,
    toggleSelection,
  } = useGraphSelection(notes);
  const {
    isDeepSelecting,
    setIsDeepSelecting,
    selectedSubIds,
    toggleSub,
    closeDeepSelection,
    canConfirmDeep,
  } = useGraphDeepSelection(selectedNodeId);
  const { displayNodes, displayEdges } = useGraphDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
  );
  const layoutKey = useMemo(() => {
    const nodeKey = elkNodes.map((node) => node.id).join("|");
    const edgeKey = elkEdges.map((edge) => edge.id).join("|");
    return `${nodeKey}-${edgeKey}`;
  }, [elkEdges, elkNodes]);

  const emptyState = !isLoading && notes.length === 0;
  const needsNote = !isLoading && !noteId && !groupId;
  const noteCount = notes.length;

  const openDeep = () => {
    if (!selectedNodeId) return;
    if (!groupId) {
      router.push(`/session/deep?mainId=${selectedNodeId}`);
      return;
    }
    closeDeepSelection();
    setIsDeepSelecting(true);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>감정 그래프</p>
          <h2 className={styles.title}>
            {noteCount}개의 감정 기록이 있습니다
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={clearSelection}
          disabled={!selectedNodeId}
        >
          전체 보기
        </Button>
      </div>

      <EmotionGraphCanvas
        graphKey={layoutKey}
        displayNodes={displayNodes}
        displayEdges={displayEdges}
        isLoading={isLoading}
        needsNote={needsNote}
        emptyState={emptyState}
        isDeepSelecting={isDeepSelecting}
        onClearSelection={clearSelection}
        onSelectNode={toggleSelection}
      >
        {selectedNodeId ? (
          <FloatingActionButton
            label="Go Deeper"
            helperText="Go Deeper"
            icon={<Route size={20} />}
            onClick={openDeep}
          />
        ) : null}
        <EmotionGraphDeepOverlay
          isOpen={isDeepSelecting}
          mainNote={selectedNote}
          selectableNotes={sortedSelectableNotes}
          selectedSubIds={selectedSubIds}
          canConfirm={canConfirmDeep}
          onToggleSub={toggleSub}
          onClose={closeDeepSelection}
          onConfirm={() => {
            if (!canConfirmDeep) return;
            router.push(
              `/session/deep?mainId=${selectedNodeId}&subIds=${selectedSubIds.join(
                ",",
              )}&groupId=${groupId}`,
            );
          }}
        />
        {selectedNote ? (
          <div className={styles.detailStackWrap}>
            <EmotionGraphDetailStack selectedNote={selectedNote} />
          </div>
        ) : null}
      </EmotionGraphCanvas>
    </section>
  );
}
