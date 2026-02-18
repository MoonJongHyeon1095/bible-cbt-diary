"use client";

import pageStyles from "@/app/page.module.css";
import styles from "@/components/behavior/BehaviorPage.module.css";
import AppHeader from "@/components/header/AppHeader";
import { fetchBehaviorHistory } from "@/lib/api/emotion-behavior-history/getEmotionBehaviorHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/utils/time";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarHeart,
  CalendarRange,
  CheckCheck,
  Clock3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
  const router = useRouter();
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
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

  const trackedCountsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const history of historyQuery.data ?? []) {
      const key = history.tracked_on;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [historyQuery.data]);

  const weekCells = useMemo(() => buildCurrentWeekCells(new Date()), []);
  const weekHistoryCount = useMemo(
    () => weekCells.reduce((sum, cell) => sum + (trackedCountsByDate.get(cell.key) ?? 0), 0),
    [trackedCountsByDate, weekCells],
  );

  const recentHistories = (historyQuery.data ?? []).slice(0, 3);
  const goToDateHistory = (dateKey: string) => {
    router.push(`/behavior/history?date=${dateKey}`);
  };

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
              <article className={styles.statCard}>
                <span className={styles.statIcon}>
                  <CalendarRange size={14} />
                </span>
                <p className={styles.statLabel}>이번 주 기록</p>
                <p className={styles.statValue}>{weekHistoryCount}건</p>
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
        </div>
      </main>
    </div>
  );
}
