"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import EmotionNoteSearchSection from "@/components/search/EmotionNoteSearchSection";
import { useCbtToast } from "@/components/session/common/CbtToast";
import SafeButton from "@/components/ui/SafeButton";
import { postEmotionNoteFlow } from "@/lib/api/flow/postEmotionNoteFlow";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  invalidateFlowDetailQuery,
  invalidateFlowListQueries,
  patchFlowCountAcrossLists,
} from "../domain/query/flowQueryClient";
import styles from "./FlowDetailImportModal.module.css";

type FlowDetailImportModalProps = {
  open: boolean;
  access: AccessContext;
  flowId: number;
  onClose: () => void;
  onImported?: (noteId: number) => void;
};

export default function FlowDetailImportModal({
  open,
  access,
  flowId,
  onClose,
  onImported,
}: FlowDetailImportModalProps) {
  useModalOpen(open);
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();
  const [importingNoteId, setImportingNoteId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setImportingNoteId(null);
    }
  }, [open]);

  if (!open) return null;

  const handleImport = async (note: EmotionNote) => {
    if (access.mode === "blocked") {
      pushToast("플로우에 가져오기 위해 로그인 해주세요.", "error");
      return;
    }

    setImportingNoteId(note.id);
    const { response, data } = await postEmotionNoteFlow(access, {
      note_id: note.id,
      flow_id: flowId,
    });

    if (!response.ok || !data.ok) {
      pushToast(data.message ?? "플로우에 기록을 추가하지 못했습니다.", "error");
      setImportingNoteId(null);
      return;
    }

    patchFlowCountAcrossLists(queryClient, flowId, 1);
    await Promise.all([
      invalidateFlowDetailQuery(queryClient, access, flowId),
      invalidateFlowListQueries(queryClient, access),
    ]);

    setImportingNoteId(null);
    onImported?.(note.id);
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={styles.card}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.title}>감정 기록 가져오기</p>
            <p className={styles.subtitle}>
              검색 결과에서 기록을 눌러 플로우에 추가하세요.
            </p>
          </div>
          <SafeButton
            type="button"
            variant="ghost"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </SafeButton>
        </div>
        <div className={styles.body}>
          <EmotionNoteSearchSection
            access={access}
            onImportNote={handleImport}
            importingNoteId={importingNoteId}
            excludeFlowId={flowId}
          />
        </div>
      </div>
    </div>
  );
}
