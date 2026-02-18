"use client";

import pageStyles from "@/app/page.module.css";
import styles from "@/components/behavior/BehaviorPage.module.css";
import AppHeader from "@/components/header/AppHeader";
import SafeButton from "@/components/ui/SafeButton";
import { fetchBehaviorHistory } from "@/lib/api/emotion-behavior-history/getEmotionBehaviorHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/utils/time";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCheck, Undo2, ClipboardList } from "lucide-react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY_HISTORIES: Array<
  Awaited<ReturnType<typeof fetchBehaviorHistory>>["data"]["histories"][number]
> = [];

export default function BehaviorDateHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDate = searchParams.get("date") ?? "";
  const targetDate = DATE_KEY_PATTERN.test(rawDate)
    ? rawDate
    : formatKoreanDateKey(new Date());

  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  const historyQuery = useQuery({
    queryKey: [...queryKeys.behaviorHistory(access), "date", targetDate],
    queryFn: async () => {
      const { response, data } = await fetchBehaviorHistory(access, {
        trackedOn: targetDate,
      });
      if (!response.ok) throw new Error("behavior history by date fetch failed");
      return data.histories;
    },
    enabled: !isLoading && accessMode !== "blocked",
  });

  const histories = historyQuery.data ?? EMPTY_HISTORIES;
  const totals = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const history of histories) {
      const checks = history.checks ?? [];
      done += checks.filter((row) => row.is_done).length;
      total += checks.length;
    }
    return { done, total };
  }, [histories]);

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          <section className={`${styles.hero} ${styles.dateHistoryHero}`}>
            <p className={styles.heroEyebrow}>Daily History</p>
            <h2 className={styles.heroTitle}>{targetDate} 기록</h2>
            <div className={styles.dateHistoryMeta}>
              <span className={styles.metaBadge}>
                <ClipboardList size={14} />
                기록 {histories.length}건
              </span>
              <span className={styles.metaBadge}>
                <CheckCheck size={14} />
                체크 {totals.done}/{totals.total}
              </span>
              <span className={styles.metaBadge}>
                <CalendarDays size={14} />
                {targetDate}
              </span>
            </div>
          </section>

          <section className={`${styles.section} ${styles.dateHistoryListSection}`}>
            {historyQuery.isLoading ? (
              <p className={styles.empty}>불러오는 중...</p>
            ) : histories.length === 0 ? (
              <p className={styles.empty}>해당 날짜의 기록이 없습니다.</p>
            ) : (
              <div className={styles.dateHistoryGrid}>
                {histories.map((history) => {
                  const doneCount = (history.checks ?? []).filter((row) => row.is_done).length;
                  const totalCount = (history.checks ?? []).length;
                  return (
                    <article key={history.id} className={styles.dateHistoryCard}>
                      <p className={styles.dateHistoryTitle}>
                        {`행동 #${history.behavior_detail_id}`}
                      </p>
                      <p className={styles.dateHistoryInfo}>
                        {formatKoreanDateTime(history.created_at, {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className={styles.dateHistorySummary}>
                        체크 완료 {doneCount}/{totalCount}
                      </p>
                      {(history.checks ?? []).length > 0 ? (
                        <div className={styles.dateHistoryCheckList}>
                          {(history.checks ?? []).map((check) => (
                            <p key={check.id} className={styles.dateHistoryCheckRow}>
                              {check.is_done ? "완료" : "미완료"} ·{" "}
                              {check.check_label ?? `체크 #${check.check_id}`}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      {history.comments ? (
                        <p className={styles.behaviorDesc}>{history.comments}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <SafeButton
        variant="unstyled"
        className={styles.trackBackFab}
        onClick={() => router.back()}
        aria-label="뒤로가기"
      >
        <Undo2 size={20} />
      </SafeButton>
    </div>
  );
}
