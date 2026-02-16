"use client";

import pageStyles from "@/app/page.module.css";
import styles from "@/components/behavior/BehaviorPage.module.css";
import AppHeader from "@/components/header/AppHeader";
import { useCbtToast } from "@/components/session/common/CbtToast";
import SafeButton from "@/components/ui/SafeButton";
import { deleteBehaviorDetail } from "@/lib/api/emotion-behavior-details/deleteEmotionBehaviorDetails";
import { fetchBehaviorDetails } from "@/lib/api/emotion-behavior-details/getEmotionBehaviorDetails";
import { fetchBehaviorHistory } from "@/lib/api/emotion-behavior-history/getEmotionBehaviorHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/utils/time";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarHeart,
  CalendarRange,
  CheckCheck,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Footprints,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildCurrentWeekCells = (base: Date) => {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const weekday = ["일", "월", "화", "수", "목", "금", "토"];
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toDateKey(date),
      label: weekday[index],
      day: date.getDate(),
    };
  });
};

export default function BehaviorPage() {
  const PAGE_SIZE = 5;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"created_desc" | "recorded_desc">(
    "created_desc",
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  const detailsQuery = useInfiniteQuery({
    queryKey: [
      "emotion-behavior-library",
      access.mode,
      access.accessToken ?? null,
      searchQuery.trim(),
      sortMode,
      PAGE_SIZE,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = Number(pageParam ?? 0);
      const { response, data } = await fetchBehaviorDetails(access, {
        query: searchQuery.trim(),
        sort: sortMode,
        limit: PAGE_SIZE,
        offset,
      });
      if (!response.ok) throw new Error("behavior details fetch failed");
      return {
        details: data.details,
        total: data.total ?? 0,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (acc, page) => acc + (page.details?.length ?? 0),
        0,
      );
      return loaded < (lastPage.total ?? 0) ? loaded : undefined;
    },
    enabled: !isLoading && accessMode !== "blocked",
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.behaviorHistory(access),
    queryFn: async () => {
      const { response, data } = await fetchBehaviorHistory(access);
      if (!response.ok) throw new Error("behavior history fetch failed");
      return data.histories;
    },
    enabled: !isLoading && accessMode !== "blocked",
  });

  const todayKey = formatKoreanDateKey(new Date());
  const behaviorCount = detailsQuery.data?.pages?.[0]?.total ?? 0;
  const historyCount = historyQuery.data?.length ?? 0;
  const todayHistories = useMemo(
    () =>
      historyQuery.data?.filter((history) => history.tracked_on === todayKey) ??
      [],
    [historyQuery.data, todayKey],
  );

  const todayCompletion = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const history of todayHistories) {
      const checks = history.checks ?? [];
      done += checks.filter((item) => item.is_done).length;
      total += checks.length;
    }
    return { done, total };
  }, [todayHistories]);
  const completionRate =
    todayCompletion.total > 0
      ? Math.round((todayCompletion.done / todayCompletion.total) * 100)
      : 0;
  const recentHistories = (historyQuery.data ?? []).slice(0, 3);
  const visibleDetails = useMemo(
    () => detailsQuery.data?.pages.flatMap((page) => page.details ?? []) ?? [],
    [detailsQuery.data],
  );
  const trackedCountsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const history of historyQuery.data ?? []) {
      const key = history.tracked_on;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [historyQuery.data]);
  const weekCells = useMemo(() => buildCurrentWeekCells(new Date()), []);
  const totalCount = detailsQuery.data?.pages?.[0]?.total ?? 0;
  const hasNextPage = detailsQuery.hasNextPage;
  const isFetchingNextPage = detailsQuery.isFetchingNextPage;
  const fetchNextPage = detailsQuery.fetchNextPage;
  const goToDateHistory = (dateKey: string) => {
    router.push(`/behavior/history?date=${dateKey}`);
  };

  const handleDelete = async (detailId: number) => {
    if (deletingId != null) return;
    setDeletingId(detailId);
    try {
      const response = await deleteBehaviorDetail(detailId, access);
      if (!response.ok) {
        pushToast("행동 삭제에 실패했습니다.", "error");
        return;
      }
      pushToast("행동을 삭제했습니다.", "success");
      setPendingDeleteId(null);
      await queryClient.invalidateQueries({
        queryKey: ["emotion-behavior-library"],
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.behaviorHistory(access),
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        if (hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          <section className={styles.heroPanel}>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.heroEyebrow}>Behavior Care</p>
                <h2 className={styles.heroTitle}>행동 루틴 트래커</h2>
                <p className={styles.heroText}>
                  오늘 루틴 달성률을 확인하고 날짜별로 체크하세요.
                </p>
              </div>
              <div className={styles.heroMetricStack}>
                <div
                  className={styles.progressCircle}
                  style={{
                    background: `conic-gradient(#5ce4b3 0deg, #56a8ff ${
                      Math.max(0, Math.min(100, completionRate)) * 3.6
                    }deg, #1b2439 ${
                      Math.max(0, Math.min(100, completionRate)) * 3.6
                    }deg)`,
                  }}
                  aria-label={`오늘 완료율 ${completionRate}%`}
                >
                  <div className={styles.progressInner}>
                    <strong>{completionRate}%</strong>
                    <span>today</span>
                  </div>
                </div>
                <span className={styles.metaBadge}>
                  <CalendarHeart size={14} />
                  오늘 기록 {todayHistories.length}건
                </span>
              </div>
            </div>
            <div className={styles.statGrid}>
              <article className={styles.statCard}>
                <span className={styles.statIcon}>
                  <ClipboardList size={14} />
                </span>
                <p className={styles.statLabel}>저장된 행동</p>
                <p className={styles.statValue}>{behaviorCount}개</p>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statIcon}>
                  <CheckCheck size={14} />
                </span>
                <p className={styles.statLabel}>오늘 완료</p>
                <p className={styles.statValue}>
                  {todayCompletion.done}/{todayCompletion.total}
                </p>
              </article>
              <article className={styles.statCard}>
                <span className={styles.statIcon}>
                  <Activity size={14} />
                </span>
                <p className={styles.statLabel}>누적 기록</p>
                <p className={styles.statValue}>{historyCount}건</p>
              </article>
            </div>
          </section>

          <section className={`${styles.section} ${styles.recentSection}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>최근 기록</h3>
              <p className={styles.sectionHint}>마지막 활동 타임라인</p>
            </div>
            <aside className={styles.heatmapPanel}>
              <p className={styles.heatmapTitle}>
                <CalendarRange size={14} />
                이번 주 기록
              </p>
              <div className={styles.weekHeatRow}>
                {weekCells.map((cell) => {
                  const count = trackedCountsByDate.get(cell.key) ?? 0;
                  const level = count >= 4 ? 4 : count;
                  return (
                    <div key={cell.key} className={styles.weekHeatCellWrap}>
                      <span className={styles.weekHeatLabel}>{cell.label}</span>
                      <button
                        type="button"
                        className={`${styles.weekHeatCell} ${styles[`heatLevel${level}`]}`}
                        title={`${cell.key} · ${count}건`}
                        aria-label={`${cell.key} 기록 ${count}건`}
                        onClick={() => goToDateHistory(cell.key)}
                      >
                        <span className={styles.weekHeatDay}>{cell.day}</span>
                        <span className={styles.weekHeatCount}>{count}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </aside>
            {recentHistories.length === 0 ? (
              <p className={styles.empty}>아직 기록된 루틴이 없습니다.</p>
            ) : (
              <div className={styles.timeline}>
                {recentHistories.map((history) => (
                  <button
                    key={history.id}
                    type="button"
                    className={`${styles.timelineItem} ${styles.timelineActionCard}`}
                    onClick={() => goToDateHistory(history.tracked_on)}
                  >
                    <p className={styles.timelineTitle}>
                      <Clock3 size={14} />
                      {history.tracked_on}
                    </p>
                    <p className={styles.timelineText}>
                      체크{" "}
                      {
                        (history.checks ?? []).filter((item) => item.is_done)
                          .length
                      }
                      /{(history.checks ?? []).length}
                      {history.comments ? ` · ${history.comments}` : ""}
                    </p>
                    <p className={styles.timelineMeta}>
                      {formatKoreanDateTime(history.created_at, {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.section} ${styles.librarySection}`}>
            <div className={styles.libraryToolbar}>
              <div className={styles.libraryTitleBlock}>
                <h3 className={styles.sectionTitle}>내 행동 라이브러리</h3>
                <p className={styles.sectionHint}>총 {totalCount}개</p>
              </div>
              <div className={styles.librarySortRow}>
                <select
                  className={styles.sortSelect}
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(
                      event.target.value as "created_desc" | "recorded_desc",
                    )
                  }
                >
                  <option value="created_desc">생성일 최신순</option>
                  <option value="recorded_desc">기록일 최신순</option>
                </select>
              </div>
            </div>
            <label className={styles.searchBox}>
              <Search size={16} />
              <input
                className={styles.searchInput}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  setSearchQuery(searchInput);
                }}
                placeholder="제목, 내용 검색 (Enter)"
              />
            </label>
            {detailsQuery.isLoading ? (
              <p className={styles.empty}>불러오는 중...</p>
            ) : visibleDetails.length > 0 ? (
              <div className={styles.libraryList}>
                {visibleDetails.map((detail) => (
                  <article key={detail.id} className={styles.behaviorCard}>
                    <div className={styles.row}>
                      <h4 className={styles.behaviorTitle}>
                        <Footprints size={16} />
                        {detail.behavior_label}
                      </h4>
                      <div className={styles.deleteControl}>
                        <SafeButton
                          size="sm"
                          variant="ghost"
                          className={styles.deleteIconButton}
                          onClick={() =>
                            setPendingDeleteId((prev) =>
                              prev === detail.id ? null : detail.id,
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </SafeButton>
                        {pendingDeleteId === detail.id ? (
                          <div className={styles.inlineDeleteConfirm}>
                            <p className={styles.inlineDeleteText}>
                              <AlertTriangle size={14} />
                              이 행동과 관련 기록을 삭제할까요?
                            </p>
                            <div className={styles.inlineDeleteActions}>
                              <SafeButton
                                size="sm"
                                variant="danger"
                                loading={deletingId === detail.id}
                                onClick={() => void handleDelete(detail.id)}
                              >
                                삭제
                              </SafeButton>
                              <SafeButton
                                size="sm"
                                variant="outline"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                취소
                              </SafeButton>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <p className={styles.behaviorDesc}>
                      {detail.behavior_description}
                    </p>
                    {(detail.checks ?? []).length > 0 ? (
                      <div className={styles.checkList}>
                        {(detail.checks ?? []).map((check) => (
                          <span key={check.id} className={styles.checkItem}>
                            <CheckCheck size={14} />
                            {check.check_label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <span className={styles.meta}>
                      {sortMode === "recorded_desc"
                        ? detail.latest_tracked_on
                          ? `기록일 ${detail.latest_tracked_on}`
                          : "기록일 없음"
                        : `생성일 ${formatKoreanDateTime(detail.created_at, {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                    </span>
                    <SafeButton
                      size="sm"
                      className={styles.trackActionButton}
                      onClick={() => router.push(`/behavior/track?id=${detail.id}`)}
                    >
                      <ClipboardCheck size={15} />
                      기록하기
                    </SafeButton>
                  </article>
                ))}
                {hasNextPage ? (
                  <div ref={sentinelRef} className={styles.loadMoreSentinel}>
                    {isFetchingNextPage
                      ? "더 불러오는 중..."
                      : "스크롤해서 더 보기"}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className={styles.empty}>
                검색 결과가 없거나 저장된 행동이 없습니다.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
