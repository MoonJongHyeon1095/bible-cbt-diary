"use client";

import SafeButton from "@/components/ui/SafeButton";
import { fetchEmotionNoteHistoryList } from "@/lib/api/emotion-notes/getEmotionNoteHistoryList";
import { hideAllEmotionNotesFromHistory } from "@/lib/api/emotion-notes/hideAllEmotionNotesFromHistory";
import { hideOneEmotionNoteFromHistory } from "@/lib/api/emotion-notes/hideOneEmotionNoteFromHistory";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./SessionHistorySection.module.css";
import SessionHistorySectionCard, {
  SessionHistoryChip,
  SessionHistoryChipRow,
  SessionHistorySectionText,
} from "./SessionHistorySectionCard";

const SDT_LABEL_BY_KEY: Record<string, string> = {
  autonomy: "자율성",
  relatedness: "관계성",
  competence: "유능감",
};

const formatHistoryDate = (value: string) =>
  formatKoreanDateTime(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type SessionHistorySectionProps = {
  access: AccessContext;
};

export default function SessionHistorySection({
  access,
}: SessionHistorySectionProps) {
  const pageSize = 20;
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const historiesQuery = useInfiniteQuery({
    queryKey: queryKeys.emotionNotes.history(access),
    queryFn: async ({ pageParam = 0 }) => {
      const { response, data } = await fetchEmotionNoteHistoryList(access, {
        limit: pageSize,
        offset: pageParam as number,
      });
      if (!response.ok) {
        throw new Error("emotion_note_history fetch failed");
      }
      return data.notes ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < pageSize) {
        return undefined;
      }
      const total = pages.reduce((sum, page) => sum + page.length, 0);
      return total;
    },
    enabled: access.mode !== "blocked",
  });

  const histories = useMemo(() => {
    const pages = historiesQuery.data?.pages ?? [];
    const seen = new Set<number>();
    const result: EmotionNote[] = [];
    for (const page of pages) {
      for (const item of page) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  }, [historiesQuery.data?.pages]);

  const loading = historiesQuery.isPending;
  const isLoadingMore = historiesQuery.isFetchingNextPage;
  const hasMore = Boolean(historiesQuery.hasNextPage);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await historiesQuery.fetchNextPage();
  }, [hasMore, historiesQuery, isLoadingMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (historiesQuery.isError) {
      setNotice("기록을 불러오지 못했습니다.");
      return;
    }
    setNotice(null);
  }, [historiesQuery.isError]);

  const hideMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await hideOneEmotionNoteFromHistory(noteId, access);
      if (!response.ok) {
        throw new Error("hide emotion note failed");
      }
      return noteId;
    },
    onSuccess: (hiddenId) => {
      queryClient.setQueryData(queryKeys.emotionNotes.history(access), (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        const pages = (prev as { pages?: EmotionNote[][] }).pages ?? [];
        const nextPages = pages.map((page) =>
          page.filter((item) => item.id !== hiddenId),
        );
        return { ...(prev as object), pages: nextPages };
      });
    },
  });

  const hideAllMutation = useMutation({
    mutationFn: async () => {
      const response = await hideAllEmotionNotesFromHistory(access);
      if (!response.ok) {
        throw new Error("hide all emotion notes failed");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.emotionNotes.history(access), (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return { ...(prev as object), pages: [[]] };
      });
    },
  });

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await hideMutation.mutateAsync(id);
    } catch {
      setNotice("기록을 숨기지 못했습니다.");
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await hideAllMutation.mutateAsync();
    } catch {
      setNotice("기록을 숨기지 못했습니다.");
      setDeletingAll(false);
      return;
    }
    setExpanded({});
    setConfirmDeleteAll(false);
    setDeletingAll(false);
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.kicker}>History</span>
          <h2 className={styles.title}>이전 세션 기록</h2>
        </div>
        <div className={styles.actions}>
          <SafeButton
            variant="danger"
            size="sm"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={loading || histories.length === 0}
          >
            전체 삭제
          </SafeButton>
        </div>
      </div>

      {confirmDeleteAll && (
        <div className={styles.confirmBar}>
          <span>기록 목록에서 모두 숨깁니다.</span>
          <div className={styles.actions}>
            <SafeButton
              variant="danger"
              size="sm"
              onClick={handleDeleteAll}
              loading={deletingAll}
              loadingText="삭제 중..."
              disabled={loading || deletingAll}
            >
              삭제
            </SafeButton>
            <SafeButton
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteAll(false)}
              disabled={loading || deletingAll}
            >
              취소
            </SafeButton>
          </div>
        </div>
      )}

      {notice && <p className={styles.subtle}>{notice}</p>}

      <div className={styles.list}>
        {loading ? (
          <p className={styles.subtle}>기록을 불러오는 중입니다...</p>
        ) : histories.length === 0 ? (
          <div className={styles.empty}>
            <p>저장된 기록이 없습니다.</p>
            <p className={styles.subtle}>완료된 세션은 자동으로 저장됩니다.</p>
          </div>
        ) : (
          histories.map((history) => {
            const isPositive = history.emotion_type === "positive";
            const sdtLabel = history.sdt_type
              ? SDT_LABEL_BY_KEY[history.sdt_type] ?? history.sdt_type
              : "SDT";

            return (
              <div key={history.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <SafeButton
                    variant="unstyled"
                    className={styles.itemHeaderButton}
                    onClick={() => toggleExpanded(history.id)}
                    aria-expanded={expanded[history.id] ?? false}
                  >
                    <div>
                      <p className={styles.itemTitle}>
                        {history.trigger_text || history.title || "경험"}
                      </p>
                      <div className={styles.itemSummary}>
                        <span>{formatHistoryDate(history.created_at)}</span>
                      </div>
                    </div>
                    <span
                      className={`${styles.itemToggle} ${
                        expanded[history.id] ? styles.itemToggleActive : ""
                      }`}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </SafeButton>
                  <SafeButton
                    variant="ghost"
                    size="icon"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(history.id)}
                    aria-label="기록 삭제"
                    loading={deletingId === history.id}
                    loadingText=""
                    loadingBehavior="replace"
                  >
                    <Trash2 size={16} />
                  </SafeButton>
                </div>

                {expanded[history.id] && (
                  <div className={styles.itemBody}>
                    <SessionHistorySectionCard title="경험">
                      <SessionHistorySectionText>
                        {history.trigger_text || "기록 없음"}
                      </SessionHistorySectionText>
                    </SessionHistorySectionCard>

                    <SessionHistorySectionCard title="감정">
                      <SessionHistoryChipRow>
                        {(history.emotion_tags ?? []).map((tag) => (
                          <SessionHistoryChip key={`${history.id}-emotion-${tag}`}>
                            {tag}
                          </SessionHistoryChip>
                        ))}
                      </SessionHistoryChipRow>
                    </SessionHistorySectionCard>

                    <SessionHistorySectionCard title="자동사고">
                      <SessionHistorySectionText>
                        {history.inner_belief || "기록 없음"}
                      </SessionHistorySectionText>
                    </SessionHistorySectionCard>

                    {isPositive ? (
                      <SessionHistorySectionCard title={sdtLabel}>
                        <SessionHistorySectionText>
                          {history.sdt_empathy_text || "기록 없음"}
                        </SessionHistorySectionText>
                        {history.reflection_question ? (
                          <SessionHistorySectionText>
                            {history.reflection_question}
                          </SessionHistorySectionText>
                        ) : null}
                      </SessionHistorySectionCard>
                    ) : (
                      <>
                        <SessionHistorySectionCard title="Distortion">
                          {history.error_label ? (
                            <SessionHistoryChipRow>
                              <SessionHistoryChip>
                                {history.error_label}
                              </SessionHistoryChip>
                            </SessionHistoryChipRow>
                          ) : null}
                          <SessionHistorySectionText>
                            {history.error_description || "기록 없음"}
                          </SessionHistorySectionText>
                        </SessionHistorySectionCard>

                        <SessionHistorySectionCard title="대안 사고">
                          <SessionHistorySectionText>
                            {history.alternative || "기록 없음"}
                          </SessionHistorySectionText>
                        </SessionHistorySectionCard>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasMore && !loading ? (
        <div ref={sentinelRef} className={styles.loadMore}>
          {isLoadingMore ? (
            <>
              <span className={styles.loadMoreSpinner} aria-hidden />
              더 불러오는 중...
            </>
          ) : (
            "스크롤하여 더 보기"
          )}
        </div>
      ) : null}
    </section>
  );
}
