"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import SafeButton from "@/components/ui/SafeButton";
import { LayoutDashboard, Route, Trash2 } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { FlowListNodeViewModel } from "../nodes/FlowListNode";
import FlowListNode from "../nodes/FlowListNode";
import styles from "../FlowListSection.module.css";

type FlowSortMode = "latest" | "size";

type FlowListSectionViewProps = {
  isLoading: boolean;
  nodes: FlowListNodeViewModel[];
  selectedFlow: { id: number } | null;
  totalCount: number;
  sortMode: FlowSortMode;
  onChangeSortMode: (mode: FlowSortMode) => void;
  filterNoteId: number | null;
  filterNoteTitle: string | null;
  isFilterNoteLoading: boolean;
  confirmDelete: boolean;
  isDeleting: boolean;
  onSelectFlow: (flowId: number | null) => void;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onDeleteFlow: () => void;
  onOpenFlow: (flowId: number) => void;
};

export default function FlowListSectionView({
  isLoading,
  nodes,
  selectedFlow,
  totalCount,
  sortMode,
  onChangeSortMode,
  filterNoteId,
  filterNoteTitle,
  isFilterNoteLoading,
  confirmDelete,
  isDeleting,
  onSelectFlow,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onDeleteFlow,
  onOpenFlow,
}: FlowListSectionViewProps) {
  const hasNoteFilter = Boolean(filterNoteId);
  const summaryText = `${nodes.length}개의 플로우, ${totalCount}개의 기록`;
  const noteTitle = filterNoteTitle?.trim() || "";
  const headerTitle = hasNoteFilter
    ? isFilterNoteLoading
      ? "노트 제목을 불러오는 중..."
      : noteTitle.length > 0
        ? noteTitle
        : "선택한 노트의 플로우 목록"
    : "감정 노트 플로우";

  const handleSectionClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest(`.${styles.nodeWrap}`) ||
      target.closest(`.${styles.confirmCard}`) ||
      target.closest(`.${styles.fabPrimary}`) ||
      target.closest(`.${styles.fabSecondary}`)
    ) {
      return;
    }
    onSelectFlow(null);
  };

  return (
    <section className={styles.section} onClickCapture={handleSectionClickCapture}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerLabelRow}>
            <span className={styles.headerIconWrap} aria-hidden>
              <LayoutDashboard size={16} />
            </span>
            {hasNoteFilter ? <p className={styles.label}>감정 노트 플로우</p> : null}
          </div>
          <h2 className={styles.title}>{headerTitle}</h2>
          <p className={styles.filterLabel}>{summaryText}</p>
          <div className={styles.sortRow}>
            <SafeButton
              size="sm"
              variant={sortMode === "latest" ? "primary" : "outline"}
              onClick={() => onChangeSortMode("latest")}
            >
              최신순
            </SafeButton>
            <SafeButton
              size="sm"
              variant={sortMode === "size" ? "primary" : "outline"}
              onClick={() => onChangeSortMode("size")}
            >
              크기순
            </SafeButton>
          </div>
        </div>
      </header>

      <div
        className={styles.canvas}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onSelectFlow(null);
          }
        }}
      >
        {isLoading ? (
          <div className={styles.placeholder}>플로우를 불러오는 중...</div>
        ) : nodes.length === 0 ? (
          <div className={styles.placeholder}>아직 플로우가 없습니다.</div>
        ) : (
          <div className={styles.nodeGrid}>
            {nodes.map((node) => (
              <div key={node.id} className={styles.nodeCell}>
                <FlowListNode {...node} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFlow ? (
        <>
          <FloatingActionButton
            label="삭제"
            helperText="삭제"
            icon={<Trash2 size={20} />}
            className={styles.fabPrimary}
            onClick={onOpenDeleteConfirm}
            style={{
              backgroundColor: "#e14a4a",
              color: "#fff",
              borderColor: "#b93333",
            }}
          />
          <FloatingActionButton
            label="Flow"
            helperText="flow로 이동"
            icon={<Route size={20} />}
            className={styles.fabSecondary}
            onClick={() => onOpenFlow(selectedFlow.id)}
            style={{
              backgroundColor: "#121417",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          />
        </>
      ) : null}

      {confirmDelete && selectedFlow ? (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          onClick={onCloseDeleteConfirm}
        >
          <div
            className={styles.confirmCard}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.confirmTitle}>이 플로우를 삭제할까요?</p>
            <p className={styles.confirmBody}>
              플로우의 연결 기록은 제거되지만, 노트 자체는 삭제되지 않습니다.
            </p>
            <div className={styles.confirmActions}>
              <SafeButton
                variant="danger"
                onClick={onDeleteFlow}
                loading={isDeleting}
                loadingText="삭제 중..."
                disabled={isDeleting}
              >
                삭제
              </SafeButton>
              <SafeButton
                variant="outline"
                onClick={onCloseDeleteConfirm}
                disabled={isDeleting}
              >
                취소
              </SafeButton>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
