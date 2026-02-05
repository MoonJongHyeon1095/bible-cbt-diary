"use client";

import SafeButton from "@/components/ui/SafeButton";
import type { AccessContext } from "@/lib/types/access";
import type { SessionHistory } from "@/lib/types/cbtTypes";
import { normalizeSelectedCognitiveErrors } from "@/lib/utils/normalizeSelectedCognitiveErrors";
import { formatKoreanDateTime } from "@/lib/utils/time";
import { ChevronDown, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./SessionHistorySection.module.css";
import SessionHistorySectionCard, {
  SessionHistoryChip,
  SessionHistoryChipRow,
  SessionHistorySectionItalic,
  SessionHistorySectionText,
} from "./SessionHistorySectionCard";
import { deleteAllSessionHistories } from "@/lib/api/session-history/deleteAllSessionHistories";
import { deleteSessionHistory } from "@/lib/api/session-history/deleteSessionHistory";
import { fetchSessionHistories } from "@/lib/api/session-history/getSessionHistories";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

const formatHistoryDate = (value: string) =>
  formatKoreanDateTime(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatScriptureReference = (
  bibleVerse: SessionHistory["bibleVerse"],
): string => {
  if (!bibleVerse) return "";
  const chapter = bibleVerse.chapter ? `${bibleVerse.chapter}장` : "";
  const verseRange = bibleVerse.startVerse
    ? bibleVerse.endVerse && bibleVerse.endVerse !== bibleVerse.startVerse
      ? `${bibleVerse.startVerse}-${bibleVerse.endVerse}`
      : `${bibleVerse.startVerse}`
    : "";
  const verseLabel = verseRange ? ` ${verseRange}절` : "";
  return `${bibleVerse.book} ${chapter}${verseLabel}`.trim();
};

type SessionHistorySectionProps = {
  access: AccessContext;
};

export default function SessionHistorySection({ access }: SessionHistorySectionProps) {
  const pageSize = 20;
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const historiesQuery = useInfiniteQuery({
    queryKey: queryKeys.sessionHistory.list(access),
    queryFn: async ({ pageParam = 0 }) => {
      const { response, data } = await fetchSessionHistories(access, {
        limit: pageSize,
        offset: pageParam as number,
      });
      if (!response.ok) {
        throw new Error("session_history fetch failed");
      }
      const normalized = (data.histories ?? []).map((history) => ({
        ...history,
        emotionThoughtPairs: Array.isArray(history.emotionThoughtPairs)
          ? history.emotionThoughtPairs
          : [],
        selectedCognitiveErrors: normalizeSelectedCognitiveErrors(
          history.selectedCognitiveErrors,
        ),
      }));
      return normalized as SessionHistory[];
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
    const seen = new Set<string>();
    const result: SessionHistory[] = [];
    pages.forEach((page) => {
      page.forEach((item) => {
        if (seen.has(item.id)) return;
        seen.add(item.id);
        result.push(item);
      });
    });
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
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    if (historiesQuery.isError) {
      setNotice("세션 기록을 불러오지 못했습니다.");
      return;
    }
    setNotice(null);
  }, [historiesQuery.isError]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { response } = await deleteSessionHistory(access, id);
      if (!response.ok) {
        throw new Error("delete session history failed");
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        queryKeys.sessionHistory.list(access),
        (prev) => {
          if (!prev || typeof prev !== "object") return prev;
          const pages = (prev as { pages?: SessionHistory[][] }).pages ?? [];
          const nextPages = pages.map((page) =>
            page.filter((item) => item.id !== deletedId),
          );
          return { ...(prev as object), pages: nextPages };
        },
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { response } = await deleteAllSessionHistories(access);
      if (!response.ok) {
        throw new Error("delete all session history failed");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.sessionHistory.list(access), (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return { ...(prev as object), pages: [[]] };
      });
    },
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      setNotice("세션 기록을 삭제하지 못했습니다.");
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllMutation.mutateAsync();
    } catch {
      setNotice("세션 기록을 삭제하지 못했습니다.");
      setDeletingAll(false);
      return;
    }
    setExpanded({});
    setConfirmDeleteAll(false);
    setDeletingAll(false);
  };

  const toggleExpanded = (id: string) => {
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
          <span>이전 세션 기록이 모두 삭제됩니다.</span>
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
          histories.map((history) => (
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
                      {history.userInput || "경험"}
                    </p>
                    <div className={styles.itemSummary}>
                      <span>{formatHistoryDate(history.timestamp)}</span>
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
                  {history.userInput && (
                    <SessionHistorySectionCard title="경험">
                      <SessionHistorySectionText>
                        {history.userInput}
                      </SessionHistorySectionText>
                    </SessionHistorySectionCard>
                  )}

                  {history.emotionThoughtPairs.length > 0 && (
                    <SessionHistorySectionCard title="감정 & 자동사고">
                      {history.emotionThoughtPairs.map((pair, index) => (
                        <div key={`${history.id}-pair-${index}`}>
                          <SessionHistoryChipRow>
                            <SessionHistoryChip>
                              {pair.emotion}
                            </SessionHistoryChip>
                            {pair.intensity != null && (
                              <SessionHistoryChip>
                                강도 {pair.intensity}/100
                              </SessionHistoryChip>
                            )}
                          </SessionHistoryChipRow>
                          <SessionHistorySectionText>
                            {pair.thought}
                          </SessionHistorySectionText>
                        </div>
                      ))}
                    </SessionHistorySectionCard>
                  )}

                  {history.selectedCognitiveErrors.length > 0 && (
                    <SessionHistorySectionCard title="인지 오류">
                      {history.selectedCognitiveErrors.map((error, index) => (
                        <div key={`${history.id}-error-${index}`}>
                          <SessionHistoryChipRow>
                            <SessionHistoryChip>
                              {error.title}
                            </SessionHistoryChip>
                          </SessionHistoryChipRow>
                          {error.detail ? (
                            <SessionHistorySectionText>
                              {error.detail}
                            </SessionHistorySectionText>
                          ) : null}
                        </div>
                      ))}
                    </SessionHistorySectionCard>
                  )}

                  {history.selectedAlternativeThought && (
                    <SessionHistorySectionCard title="대안 사고">
                      <SessionHistorySectionItalic>
                        {history.selectedAlternativeThought}
                      </SessionHistorySectionItalic>
                    </SessionHistorySectionCard>
                  )}

                  {history.selectedBehavior && (
                    <SessionHistorySectionCard title="행동 반응">
                      <SessionHistoryChipRow>
                        <SessionHistoryChip>
                          {history.selectedBehavior.behaviorLabel}
                        </SessionHistoryChip>
                      </SessionHistoryChipRow>
                      <SessionHistorySectionText>
                        {history.selectedBehavior.behaviorText}
                      </SessionHistorySectionText>
                    </SessionHistorySectionCard>
                  )}

                  {history.bibleVerse && (
                    <SessionHistorySectionCard title="성경 말씀">
                      <SessionHistoryChipRow>
                        <SessionHistoryChip>
                          {formatScriptureReference(history.bibleVerse) ||
                            "말씀"}
                        </SessionHistoryChip>
                      </SessionHistoryChipRow>
                      <SessionHistorySectionItalic>
                        “{history.bibleVerse.verse}”
                      </SessionHistorySectionItalic>
                    </SessionHistorySectionCard>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {hasMore && !loading ? (
        <div ref={sentinelRef} className={styles.loadMore}>
          {isLoadingMore ? (
            <>
              <span className={styles.loadMoreSpinner} aria-hidden />더 불러오는
              중...
            </>
          ) : (
            "스크롤하여 더 보기"
          )}
        </div>
      ) : null}
    </section>
  );
}
