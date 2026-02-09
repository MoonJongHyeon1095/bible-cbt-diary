"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import { Waypoints } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./EmotionNoteSection.module.css";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import SafeButton from "@/components/ui/SafeButton";
import { useCbtToast } from "@/components/cbt/common/CbtToast";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { goToFlowForNote } from "@/lib/flow/goToFlowForNote";
import EmotionNoteCardOverlay from "./EmotionNoteCardOverlay";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

type EmotionNoteCardProps = {
  note: EmotionNote;
  isTourTarget?: boolean;
  canGoDeeper?: boolean;
  detailHref?: string;
  onImport?: (note: EmotionNote) => void;
  isImporting?: boolean;
};

export default function EmotionNoteCard({
  note,
  isTourTarget = false,
  canGoDeeper = true,
  detailHref,
  onImport,
  isImporting = false,
}: EmotionNoteCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressStartRef = useRef<number | null>(null);
  const longPressRafRef = useRef<number | null>(null);
  const longPressOverlayDelayRef = useRef<number | null>(null);
  const longPressOverlayHoldRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const { openAuthModal } = useAuthModal();
  const { pushToast } = useCbtToast();
  const { accessMode, accessToken } = useAccessContext();
  const isImportMode = Boolean(onImport);

  const longPressDuration = 500;
  const longPressOverlayDelay = 120;
  const timeLabel = formatKoreanDateTime(note.created_at, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emotionTags = note.emotion_labels ?? [];
  const errorTags = note.error_labels ?? [];
  const behaviorTags = note.behavior_labels ?? [];
  const flowIds = note.flow_ids ?? [];
  const sortedFlowIds = [...flowIds].sort((a, b) => b - a);
  const primaryFlowId = sortedFlowIds[0] ?? null;
  const extraFlowCount = Math.max(0, flowIds.length - (primaryFlowId ? 1 : 0));
  const flowTitle =
    flowIds.length > 0 ? `Flow: ${sortedFlowIds.join(", ")}` : undefined;

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
      if (longPressOverlayDelayRef.current !== null) {
        window.clearTimeout(longPressOverlayDelayRef.current);
      }
      if (longPressOverlayHoldRef.current !== null) {
        window.clearTimeout(longPressOverlayHoldRef.current);
      }
      if (longPressRafRef.current !== null) {
        window.cancelAnimationFrame(longPressRafRef.current);
      }
    };
  }, []);

  const clearLongPressProgress = (hold = true) => {
    if (longPressRafRef.current !== null) {
      window.cancelAnimationFrame(longPressRafRef.current);
      longPressRafRef.current = null;
    }
    longPressStartRef.current = null;
    if (longPressOverlayHoldRef.current !== null) {
      window.clearTimeout(longPressOverlayHoldRef.current);
    }
    if (!hold) {
      setPressProgress(0);
      setIsPressing(false);
      return;
    }
    longPressOverlayHoldRef.current = window.setTimeout(() => {
      setPressProgress(0);
      setIsPressing(false);
    }, 220);
  };

  const clearLongPress = (hold = true) => {
    if (longPressTriggeredRef.current) {
      return;
    }
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (longPressOverlayDelayRef.current !== null) {
      window.clearTimeout(longPressOverlayDelayRef.current);
      longPressOverlayDelayRef.current = null;
    }
    clearLongPressProgress(hold);
  };

  const handlePointerDown = () => {
    if (isImportMode) return;
    clearLongPress(false);
    longPressTriggeredRef.current = false;
    setIsTriggered(false);
    longPressOverlayDelayRef.current = window.setTimeout(() => {
      setIsPressing(true);
    }, longPressOverlayDelay);
    longPressStartRef.current = null;
    const tick = (timestamp: number) => {
      if (longPressStartRef.current === null) {
        longPressStartRef.current = timestamp;
      }
      const elapsed = timestamp - longPressStartRef.current;
      const progress = Math.min(elapsed / longPressDuration, 1);
      setPressProgress(progress);
      if (progress < 1 && longPressTimeoutRef.current !== null) {
        longPressRafRef.current = window.requestAnimationFrame(tick);
      }
    };
    longPressRafRef.current = window.requestAnimationFrame(tick);
    longPressTimeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsTriggered(true);
      setPressProgress(1);
      setIsPressing(true);
      if (!canGoDeeper) {
        openAuthModal();
        return;
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      const go = async () => {
        const allowed = await checkUsage();
        if (!allowed) {
          longPressTriggeredRef.current = false;
          setIsTriggered(false);
          setPressProgress(0);
          setIsPressing(false);
          return;
        }
        const access = { mode: accessMode, accessToken };
        if (access.mode === "blocked") {
          pushToast("플로우를 준비할 수 없습니다.", "error");
          longPressTriggeredRef.current = false;
          setIsTriggered(false);
          setPressProgress(0);
          setIsPressing(false);
          return;
        }
        const ok = await goToFlowForNote({
          noteId: note.id,
          flowIds: note.flow_ids,
          access,
          router,
          onError: (message) => pushToast(message, "error"),
          onCreated: () => {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.flow.all,
            });
          },
        });
        if (!ok) {
          longPressTriggeredRef.current = false;
          setIsTriggered(false);
          setPressProgress(0);
          setIsPressing(false);
          return;
        }
      };
      void go();
    }, longPressDuration);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isImportMode) {
      event.preventDefault();
      event.stopPropagation();
      if (!isImporting) {
        onImport?.(note);
      }
      return;
    }
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    router.push(resolvedDetailHref);
  };

  const resolvedDetailHref = detailHref ?? `/detail?id=${note.id}`;

  return (
    <SafeButton
      mode="native"
      type="button"
      className={styles.noteCard}
      data-tour={isTourTarget ? "note-card" : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={() => clearLongPress()}
      onPointerLeave={() => clearLongPress()}
      onPointerCancel={() => clearLongPress()}
      onClick={handleClick}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className={styles.noteHeader}>
        <h4 className={styles.noteTitle}>{note.title}</h4>
        <div className={styles.noteMeta}>
          {primaryFlowId ? (
            <span className={styles.flowBadge} title={flowTitle}>
              <Waypoints size={12} className={styles.flowBadgeIcon} />
              {`Flow #${primaryFlowId}${
                extraFlowCount > 0 ? ` +${extraFlowCount} more` : ""
              }`}
            </span>
          ) : null}
          <span className={styles.noteTime}>{timeLabel}</span>
        </div>
      </div>
      {(emotionTags.length > 0 ||
        errorTags.length > 0 ||
        behaviorTags.length > 0) && (
        <div className={styles.noteTags}>
          {emotionTags.map((tag) => (
            <span key={`emotion-${tag}`} className={styles.tagEmotion}>
              {tag}
            </span>
          ))}
          {errorTags.map((tag) => (
            <span key={`error-${tag}`} className={styles.tagError}>
              {tag}
            </span>
          ))}
          {behaviorTags.map((tag) => (
            <span key={`behavior-${tag}`} className={styles.tagBehavior}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className={styles.noteTrigger}>{note.trigger_text}</p>
      {isImportMode ? (
        <EmotionNoteCardOverlay
          mode="import"
          isActive={isImporting}
          isLoading={isImporting}
        />
      ) : (
        <EmotionNoteCardOverlay
          mode="longPress"
          isPressing={isPressing}
          pressProgress={pressProgress}
          isTriggered={isTriggered}
          canGoDeeper={canGoDeeper}
        />
      )}
    </SafeButton>
  );
}
