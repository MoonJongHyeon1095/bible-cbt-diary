"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import SafeButton from "@/components/ui/SafeButton";
import { Route, Trash2, Waypoints } from "lucide-react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { LegacyRef } from "react";
import styles from "../FlowListSection.module.css";

type GroupNode = {
  id: number;
  noteCount: number;
  title: string;
  description: string | null;
  radius: number;
  color: string;
  rgb: [number, number, number];
  x: number;
  y: number;
};

type FlowListSectionViewProps = {
  containerRef: LegacyRef<HTMLDivElement>;
  isPanning: boolean;
  isLoading: boolean;
  nodes: GroupNode[];
  pan: { x: number; y: number };
  selectedFlowId: number | null;
  selectedFlow: { id: number } | null;
  selectedNode: GroupNode | null;
  isSimulating: boolean;
  totalCount: number;
  confirmDelete: boolean;
  isDeleting: boolean;
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelectFlow: (flowId: number) => void;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onDeleteFlow: () => void;
  onOpenFlow: (flowId: number) => void;
};

export default function FlowListSectionView({
  containerRef,
  isPanning,
  isLoading,
  nodes,
  pan,
  selectedFlowId,
  selectedFlow,
  selectedNode,
  isSimulating,
  totalCount,
  confirmDelete,
  isDeleting,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onSelectFlow,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onDeleteFlow,
  onOpenFlow,
}: FlowListSectionViewProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>감정 노트 플로우</p>
          <h2 className={styles.title}>
            {nodes.length}개의 플로우, {totalCount}개의 기록
          </h2>
        </div>
      </header>

      <div
        ref={containerRef}
        className={`${styles.canvas} ${isPanning ? styles.canvasPanning : ""}`}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerLeave={onCanvasPointerUp}
      >
        {isLoading ? (
          <div className={styles.placeholder}>플로우를 불러오는 중...</div>
        ) : nodes.length === 0 ? (
          <div className={styles.placeholder}>아직 플로우가 없습니다.</div>
        ) : (
          <div
            className={styles.canvasLayer}
            style={
              {
                "--pan-x": `${pan.x}px`,
                "--pan-y": `${pan.y}px`,
              } as CSSProperties
            }
          >
            {nodes.map((node) => {
              const displayTitle = node.title.trim() || `플로우 ${node.id}`;
              return (
                <SafeButton
                  mode="native"
                  key={node.id}
                  type="button"
                  className={`${styles.node} ${
                    selectedFlowId === node.id ? styles.nodeSelected : ""
                  } ${isSimulating ? styles.nodeNoTransition : ""}`}
                  style={
                    {
                      width: node.radius * 2,
                      height: node.radius * 2,
                      backgroundColor: node.color,
                      "--tx": `${node.x - node.radius}px`,
                      "--ty": `${node.y - node.radius}px`,
                      "--node-r": node.rgb[0],
                      "--node-g": node.rgb[1],
                      "--node-b": node.rgb[2],
                    } as CSSProperties
                  }
                  onClick={() => onSelectFlow(node.id)}
                >
                  <span className={styles.nodeGroup}>
                    <Waypoints size={12} className={styles.nodeGroupIcon} />
                    #{node.id}
                  </span>
                  <span className={styles.nodeTitle}>{displayTitle}</span>
                  <span className={styles.nodeCountLine}>
                    <span className={styles.nodeCount}>{node.noteCount}</span> 개의 기록
                  </span>
                </SafeButton>
              );
            })}
            {selectedNode && (selectedNode.description?.trim() ?? "") ? (
              <div
                className={styles.nodeTooltip}
                role="status"
                style={
                  {
                    left: `${selectedNode.x}px`,
                    top: `${selectedNode.y - selectedNode.radius - 18}px`,
                  } as CSSProperties
                }
              >
                <div className={styles.nodeTooltipTitle}>
                  {selectedNode.title.trim() || `플로우 ${selectedNode.id}`}
                </div>
                <div className={styles.nodeTooltipBody}>{selectedNode.description}</div>
              </div>
            ) : null}
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
