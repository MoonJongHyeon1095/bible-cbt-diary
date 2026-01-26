"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import Button from "@/components/ui/Button";
import { BookSearch, LayoutDashboard, Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import EmotionGraphCanvas from "./EmotionGraphCanvas";
import EmotionGraphDeepSelectModal from "./EmotionGraphDeepSelectModal";
import EmotionGraphDetailStack from "./EmotionGraphDetailStack";
import styles from "./EmotionGraphSection.module.css";
import { useElkLayout } from "./hooks/useElkLayout";
import { useEmotionGraphData } from "./hooks/useEmotionGraphData";
import { useGraphDeepSelection } from "./hooks/useGraphDeepSelection";
import { useGraphDisplay } from "./hooks/useGraphDisplay";
import { useGraphSelection } from "./hooks/useGraphSelection";
import { getGroupThemeColor } from "./utils/graphColors";

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
  const themeColor = useMemo(
    () => (groupId ? getGroupThemeColor(groupId).rgb : undefined),
    [groupId],
  );
  const { elkNodes, elkEdges } = useElkLayout(notes, middles, themeColor);
  const {
    selectedNodeId,
    selectedNote,
    sortedSelectableNotes,
    clearSelection,
    selectNode,
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
  const handleGoDeeper = () => {
    if (!selectedNote) return;
    if (!groupId) {
      router.push(`/session/deep?mainId=${selectedNote.id}`);
      return;
    }
    closeDeepSelection();
    setIsDeepSelecting(true);
  };
  const layoutKey = useMemo(() => {
    const nodeKey = elkNodes.map((node) => node.id).join("|");
    const edgeKey = elkEdges.map((edge) => edge.id).join("|");
    return `${nodeKey}-${edgeKey}`;
  }, [elkEdges, elkNodes]);

  const emptyState = !isLoading && notes.length === 0;
  const needsNote = !isLoading && !noteId && !groupId;
  const noteCount = notes.length;

  const handleNodeClick = (nodeId: string) => {
    toggleSelection(nodeId);
  };

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
          <p className={styles.label}>감정 그래프</p>
          <h2 className={styles.title}>
            {noteCount}개의 감정 기록이 있습니다
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/graph")}
        >
          <LayoutDashboard size={18} />
          목록보기
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
        onSelectNode={handleNodeClick}
      >
        {selectedNote ? (
          <>
            <FloatingActionButton
              label="상세조회"
              helperText="상세조회"
              icon={<BookSearch size={20} />}
              onClick={() => router.push(`/detail/${selectedNote.id}`)}
            />
            <FloatingActionButton
              label="Go Deeper"
              helperText="Go Deeper"
              icon={<Route size={20} />}
              className={styles.deepFab}
              onClick={handleGoDeeper}
            />
          </>
        ) : null}
        <EmotionGraphDeepSelectModal
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
