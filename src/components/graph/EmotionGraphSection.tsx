"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import Button from "@/components/ui/Button";
import { BookSearch, LayoutDashboard, Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import EmotionGraphCanvas from "./EmotionGraphCanvas";
import EmotionGraphDetailStack from "./EmotionGraphDetailStack";
import styles from "./EmotionGraphSection.module.css";
import { useElkLayout } from "./hooks/useElkLayout";
import { useEmotionGraphData } from "./hooks/useEmotionGraphData";
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
    clearSelection,
    selectNode,
    toggleSelection,
  } = useGraphSelection(notes);
  const { displayNodes, displayEdges } = useGraphDisplay(
    elkNodes,
    elkEdges,
    selectedNodeId,
  );
  const handleGoDeeper = () => {
    if (!selectedNote) return;
    const query = groupId
      ? `/session/deep?mainId=${selectedNote.id}&groupId=${groupId}`
      : `/session/deep?mainId=${selectedNote.id}`;
    router.push(query);
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
        selectedNodeId={selectedNodeId}
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
        {selectedNote ? (
          <div className={styles.detailStackWrap}>
            <EmotionGraphDetailStack selectedNote={selectedNote} />
          </div>
        ) : null}
      </EmotionGraphCanvas>
    </section>
  );
}
