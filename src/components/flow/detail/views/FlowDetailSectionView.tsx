"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import SafeButton from "@/components/ui/SafeButton";
import { BookSearch, Check, Download, LayoutDashboard, PencilLine, Route, Trash2, X } from "lucide-react";
import type { AccessContext } from "@/lib/types/access";
import FlowDetailCanvas from "../FlowDetailCanvas";
import FlowDetailStack from "../FlowDetailStack";
import FlowDetailImportModal from "../FlowDetailImportModal";
import FlowDetailMontageModal from "../FlowDetailMontageModal";
import styles from "../FlowDetailSection.module.css";
import type { EmotionMontage } from "@/lib/types/emotionNoteTypes";
import type { Edge, Node } from "reactflow";
import type { FlowDetailNodeData } from "../nodes/FlowDetailNode";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";

type FlowDetailSectionViewProps = {
  access: AccessContext;
  flowId: number | null;
  flowTitle: string | null;
  flowDescription: string | null;
  noteCount: number;
  displayNodes: Node<FlowDetailNodeData>[];
  displayEdges: Edge[];
  axisLabels: { id: string; x: number; label: string }[];
  axisY: number | null;
  isLoading: boolean;
  needsNote: boolean;
  emptyState: boolean;
  autoCenterNodeId: string | null;
  selectedNote: EmotionNote | null;
  activeMontage: EmotionMontage | null;
  isGoDeeperLoading: boolean;
  isImportOpen: boolean;
  confirmDelete: boolean;
  isDeleting: boolean;
  isMetaEditing: boolean;
  isMetaSaving: boolean;
  metaTitleDraft: string;
  metaDescriptionDraft: string;
  layoutKey: string;
  onBackToList: () => void;
  onStartMetaEdit: () => void;
  onCancelMetaEdit: () => void;
  onSaveMeta: () => void;
  onChangeMetaTitle: (value: string) => void;
  onChangeMetaDescription: (value: string) => void;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onDeleteNote: () => void;
  onOpenDetail: (noteId: number) => void;
  onGoDeeper: () => Promise<void>;
  onOpenImport: () => void;
  onCloseImport: () => void;
  onImported: (noteId: number) => void;
  onOpenMontage: (value: EmotionMontage | null) => void;
  onClearSelection: () => void;
  onSelectNode: (nodeId: string) => void;
};

export default function FlowDetailSectionView({
  access,
  flowId,
  flowTitle,
  flowDescription,
  noteCount,
  displayNodes,
  displayEdges,
  axisLabels,
  axisY,
  isLoading,
  needsNote,
  emptyState,
  autoCenterNodeId,
  selectedNote,
  activeMontage,
  isGoDeeperLoading,
  isImportOpen,
  confirmDelete,
  isDeleting,
  isMetaEditing,
  isMetaSaving,
  metaTitleDraft,
  metaDescriptionDraft,
  layoutKey,
  onBackToList,
  onStartMetaEdit,
  onCancelMetaEdit,
  onSaveMeta,
  onChangeMetaTitle,
  onChangeMetaDescription,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onDeleteNote,
  onOpenDetail,
  onGoDeeper,
  onOpenImport,
  onCloseImport,
  onImported,
  onOpenMontage,
  onClearSelection,
  onSelectNode,
}: FlowDetailSectionViewProps) {
  const trimmedTitle = flowTitle?.trim() ?? "";
  const trimmedDescription = flowDescription?.trim() ?? "";
  const headerCount = `${noteCount}개의 감정 기록이 있습니다`;
  const headerTitle = trimmedTitle.length > 0 ? trimmedTitle : "제목 없는 플로우";
  const headerHint =
    trimmedDescription.length > 0 ? trimmedDescription : "설명이 아직 없습니다.";
  const isMetaSaveDisabled = metaTitleDraft.trim().length === 0 || isMetaSaving;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.label}>{headerCount}</p>
          {!isMetaEditing ? (
            <>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{headerTitle}</h2>
                {flowId ? (
                  <SafeButton
                    mode="native"
                    type="button"
                    className={styles.metaEditButton}
                    onClick={onStartMetaEdit}
                    aria-label="플로우 제목 및 설명 수정"
                  >
                    <PencilLine size={14} />
                    수정
                  </SafeButton>
                ) : null}
              </div>
              <p className={styles.hint}>{headerHint}</p>
            </>
          ) : (
            <div className={styles.metaEditor}>
              <input
                type="text"
                value={metaTitleDraft}
                onChange={(event) => onChangeMetaTitle(event.target.value)}
                className={styles.metaTitleInput}
                placeholder="플로우 제목"
                maxLength={60}
                disabled={isMetaSaving}
              />
              <textarea
                value={metaDescriptionDraft}
                onChange={(event) => onChangeMetaDescription(event.target.value)}
                className={styles.metaDescriptionInput}
                placeholder="플로우 설명"
                maxLength={180}
                rows={2}
                disabled={isMetaSaving}
              />
              <div className={styles.metaEditorActions}>
                <SafeButton
                  mode="native"
                  type="button"
                  className={styles.metaActionButton}
                  onClick={onCancelMetaEdit}
                  disabled={isMetaSaving}
                >
                  <X size={14} />
                  취소
                </SafeButton>
                <SafeButton
                  mode="native"
                  type="button"
                  className={`${styles.metaActionButton} ${styles.metaActionPrimary}`.trim()}
                  onClick={onSaveMeta}
                  disabled={isMetaSaveDisabled}
                >
                  <Check size={14} />
                  저장
                </SafeButton>
              </div>
            </div>
          )}
        </div>
      </div>
      <FlowDetailCanvas
        flowKey={layoutKey}
        displayNodes={displayNodes}
        displayEdges={displayEdges}
        axisLabels={axisLabels}
        axisY={axisY}
        isLoading={isLoading}
        needsNote={needsNote}
        emptyState={emptyState}
        autoCenterNodeId={autoCenterNodeId}
        onClearSelection={onClearSelection}
        onSelectNode={onSelectNode}
      >
        {selectedNote ? (
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
              label="상세조회"
              helperText="상세조회"
              icon={<BookSearch size={20} />}
              className={styles.fabSecondary}
              onClick={() => onOpenDetail(selectedNote.id)}
            />
            <FloatingActionButton
              label="Go Deeper"
              helperText="Go Deeper"
              icon={<Route size={20} />}
              className={`${styles.deepFab} ${styles.fabTertiary}`}
              onClick={onGoDeeper}
              loadingRing={isGoDeeperLoading}
              style={{
                backgroundColor: "#121417",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.35)",
              }}
            />
          </>
        ) : flowId ? (
          <>
            <FloatingActionButton
              label="목록보기"
              helperText="목록보기"
              icon={<LayoutDashboard size={20} />}
              className={styles.fabImportTop}
              onClick={onBackToList}
            />
            <FloatingActionButton
              label="Import"
              helperText="Import"
              icon={<Download size={20} />}
              className={styles.fabPrimary}
              onClick={onOpenImport}
            />
          </>
        ) : null}
        {selectedNote ? (
          <div className={styles.detailStackWrap}>
            <FlowDetailStack selectedNote={selectedNote} />
          </div>
        ) : null}
      </FlowDetailCanvas>
      {confirmDelete && selectedNote ? (
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
            <p className={styles.confirmTitle}>이 기록을 플로우에서 삭제할까요?</p>
            <p className={styles.confirmBody}>
              해당 기록은 다른 플로우나 기록 목록에서는 유지됩니다.
            </p>
            <div className={styles.confirmActions}>
              <SafeButton
                variant="danger"
                onClick={onDeleteNote}
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
      {activeMontage ? (
        <FlowDetailMontageModal
          montage={activeMontage}
          onClose={() => onOpenMontage(null)}
        />
      ) : null}
      {flowId ? (
        <FlowDetailImportModal
          open={isImportOpen}
          access={access}
          flowId={flowId}
          onClose={onCloseImport}
          onImported={onImported}
        />
      ) : null}
    </section>
  );
}
