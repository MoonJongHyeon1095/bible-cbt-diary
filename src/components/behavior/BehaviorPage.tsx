"use client";

import pageStyles from "@/app/page.module.css";
import styles from "@/components/behavior/BehaviorPage.module.css";
import AppHeader from "@/components/header/AppHeader";
import { useCbtToast } from "@/components/session/common/CbtToast";
import SafeButton from "@/components/ui/SafeButton";
import { fetchBehaviorDetails } from "@/lib/api/emotion-behavior-details/getEmotionBehaviorDetails";
import { updateBehaviorDetail } from "@/lib/api/emotion-behavior-details/patchEmotionBehaviorDetails";
import { fetchBehaviorHistory } from "@/lib/api/emotion-behavior-history/getEmotionBehaviorHistory";
import { upsertBehaviorHistory } from "@/lib/api/emotion-behavior-history/postEmotionBehaviorHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import {
  formatKoreanDateKey,
  formatKoreanDateTime,
  getKstDayRange,
} from "@/lib/utils/time";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarHeart,
  CheckCircle2,
  Circle,
  ClipboardPen,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CheckMeta = {
  checkId: number;
  label: string;
  isPinned: boolean;
};

type BehaviorHistoryRow = {
  id: number;
  tracked_on: string;
  comments: string;
  created_at: string;
  checks?: Array<{ check_id: number; is_done: boolean }>;
};

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildCurrentWeekCells = (base: Date) => {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
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

const getCompletion = (
  history:
    | {
        checks?: Array<{ check_id: number; is_done: boolean }>;
      }
    | null
    | undefined,
) => {
  const checks = history?.checks ?? [];
  const done = checks.filter((check) => check.is_done).length;
  const total = checks.length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, rate };
};

export default function BehaviorPage() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOptionalCheckIds, setSelectedOptionalCheckIds] = useState<
    Set<number>
  >(new Set());
  const [doneCheckIds, setDoneCheckIds] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState("");
  const [syncKey, setSyncKey] = useState<string>("");
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [pinLoadingByDetailId, setPinLoadingByDetailId] = useState<
    Record<number, boolean>
  >({});

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  const selectedDateKey = formatKoreanDateKey(selectedDate);
  const todayKey = formatKoreanDateKey(new Date());
  const selectedDayLabel = formatKoreanDateTime(selectedDate, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
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

  const dayRange = useMemo(() => getKstDayRange(selectedDate), [selectedDate]);
  const suggestionQuery = useQuery({
    queryKey: [
      ...queryKeys.behaviorLibrary(access),
      "daily",
      selectedDateKey,
      dayRange.startIso,
      dayRange.endIso,
    ],
    queryFn: async () => {
      const { response, data } = await fetchBehaviorDetails(access, {
        createdFrom: dayRange.startIso,
        createdTo: dayRange.endIso,
        includePinned: true,
        sort: "created_desc",
        limit: 200,
        offset: 0,
      });
      if (!response.ok) throw new Error("behavior detail fetch failed");
      return data.details;
    },
    enabled: !isLoading && accessMode !== "blocked",
  });

  const historyByDate = useMemo(() => {
    const map = new Map<string, BehaviorHistoryRow>();
    for (const history of historyQuery.data ?? []) {
      map.set(history.tracked_on, history);
    }
    return map;
  }, [historyQuery.data]);

  const selectedHistory = historyByDate.get(selectedDateKey) ?? null;
  const todayHistory = historyByDate.get(todayKey) ?? null;

  const suggestionChecks = useMemo(() => {
    const rows: CheckMeta[] = [];
    for (const detail of suggestionQuery.data ?? []) {
      for (const check of detail.checks ?? []) {
        rows.push({
          checkId: check.id,
          label: check.check_label,
          isPinned: Boolean(detail.is_pinned),
        });
      }
    }
    return rows;
  }, [suggestionQuery.data]);

  const checkMetaById = useMemo(() => {
    const map = new Map<number, CheckMeta>();
    for (const check of suggestionChecks) {
      map.set(check.checkId, check);
    }
    return map;
  }, [suggestionChecks]);

  const pinnedCheckIds = useMemo(() => {
    const set = new Set<number>();
    for (const check of suggestionChecks) {
      if (check.isPinned) set.add(check.checkId);
    }
    return set;
  }, [suggestionChecks]);

  const optionalCheckIds = useMemo(() => {
    const set = new Set<number>();
    for (const check of suggestionChecks) {
      if (!check.isPinned) set.add(check.checkId);
    }
    return set;
  }, [suggestionChecks]);

  useEffect(() => {
    const nextSyncKey = `${selectedDateKey}:${selectedHistory?.id ?? "none"}:${
      suggestionChecks.length
    }`;
    if (syncKey === nextSyncKey) return;

    const nextOptional = new Set<number>();
    const nextDone = new Set<number>();
    for (const check of selectedHistory?.checks ?? []) {
      if (check.is_done) nextDone.add(check.check_id);
      if (optionalCheckIds.has(check.check_id))
        nextOptional.add(check.check_id);
    }

    setSelectedOptionalCheckIds(nextOptional);
    setDoneCheckIds(nextDone);
    setComments(selectedHistory?.comments ?? "");
    setSyncKey(nextSyncKey);
  }, [
    optionalCheckIds,
    selectedDateKey,
    selectedHistory,
    suggestionChecks.length,
    syncKey,
  ]);

  const includedCheckIds = useMemo(() => {
    const set = new Set<number>(pinnedCheckIds);
    for (const checkId of selectedOptionalCheckIds) {
      if (optionalCheckIds.has(checkId)) set.add(checkId);
    }
    return set;
  }, [optionalCheckIds, pinnedCheckIds, selectedOptionalCheckIds]);

  const includedChecks = useMemo(() => {
    const rows = Array.from(includedCheckIds)
      .map((checkId) => checkMetaById.get(checkId))
      .filter((row): row is CheckMeta => Boolean(row));
    rows.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return a.label.localeCompare(b.label, "ko-KR");
    });
    return rows;
  }, [checkMetaById, includedCheckIds]);

  const todayCompletion = getCompletion(todayHistory);
  const weekCells = useMemo(
    () => buildCurrentWeekCells(selectedDate),
    [selectedDate],
  );
  const weeklyCompletion = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const cell of weekCells) {
      const completion = getCompletion(historyByDate.get(cell.key));
      done += completion.done;
      total += completion.total;
    }
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, rate };
  }, [historyByDate, weekCells]);

  const toggleOptionalCheck = (checkId: number) => {
    setSelectedOptionalCheckIds((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
        setDoneCheckIds((current) => {
          const updated = new Set(current);
          updated.delete(checkId);
          return updated;
        });
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  const toggleDoneCheck = (checkId: number) => {
    setDoneCheckIds((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) next.delete(checkId);
      else next.add(checkId);
      return next;
    });
  };

  const handleSaveRecord = async () => {
    const checks = includedChecks.map((check) => ({
      check_id: check.checkId,
      is_done: doneCheckIds.has(check.checkId),
    }));
    setIsSavingRecord(true);
    try {
      const response = await upsertBehaviorHistory(
        {
          tracked_on: selectedDateKey,
          comments,
          checks,
        },
        access,
      );
      if (!response.ok) {
        pushToast("행동 기록 저장에 실패했습니다.", "error");
        return;
      }
      pushToast("행동 기록을 저장했습니다.", "success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.behaviorHistory(access),
      });
      setSyncKey("");
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleTogglePin = async (detailId: number, isPinned: boolean) => {
    setPinLoadingByDetailId((prev) => ({ ...prev, [detailId]: true }));
    try {
      const response = await updateBehaviorDetail(
        {
          id: detailId,
          is_pinned: !isPinned,
        },
        access,
      );
      if (!response.ok) {
        pushToast("핀 상태 변경에 실패했습니다.", "error");
        return;
      }
      pushToast(
        !isPinned ? "행동을 고정했습니다." : "행동 고정을 해제했습니다.",
        "success",
      );
      await queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.behaviorLibrary(access),
          "daily",
          selectedDateKey,
          dayRange.startIso,
          dayRange.endIso,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.behaviorLibrary(access),
      });
    } finally {
      setPinLoadingByDetailId((prev) => ({ ...prev, [detailId]: false }));
    }
  };

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          <section className={styles.heroPanel}>
            <div className={styles.heroHeader}>
              <div>
                <p className={styles.heroEyebrow}>Behavior Tracking</p>
                <h2 className={styles.heroTitle}>행동 루틴 트래커</h2>
              </div>
              <div className={styles.heroMetricStack}>
                <div className={styles.metricCircleCard}>
                  <div
                    className={styles.progressCircle}
                    style={{
                      background: `conic-gradient(#5ce4b3 0deg, #56a8ff ${
                        Math.max(0, Math.min(100, todayCompletion.rate)) * 3.6
                      }deg, #1b2439 ${
                        Math.max(0, Math.min(100, todayCompletion.rate)) * 3.6
                      }deg)`,
                    }}
                    aria-label={`오늘 완료율 ${todayCompletion.rate}%`}
                  >
                    <div className={styles.progressInner}>
                      <strong>{todayCompletion.rate}%</strong>
                      <span>today</span>
                    </div>
                  </div>
                  <span className={styles.metaBadge}>
                    <CalendarHeart size={14} />
                    오늘 {todayCompletion.done}/{todayCompletion.total}
                  </span>
                </div>
                <div className={styles.metricCircleCard}>
                  <div
                    className={styles.progressCircle}
                    style={{
                      background: `conic-gradient(#75e39a 0deg, #58cbcc ${
                        Math.max(0, Math.min(100, weeklyCompletion.rate)) * 3.6
                      }deg, #1b2439 ${
                        Math.max(0, Math.min(100, weeklyCompletion.rate)) * 3.6
                      }deg)`,
                    }}
                    aria-label={`주간 완료율 ${weeklyCompletion.rate}%`}
                  >
                    <div className={styles.progressInner}>
                      <strong>{weeklyCompletion.rate}%</strong>
                      <span>weekly</span>
                    </div>
                  </div>
                  <span className={styles.metaBadge}>
                    <CalendarDays size={14} />
                    이번 주 {weeklyCompletion.done}/{weeklyCompletion.total}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`${styles.sectionHeader} ${styles.trackerDateHeader}`}
            >
              <h3 className={`${styles.sectionTitle} ${styles.trackerDateTitle}`}>
                {selectedDateKey}
              </h3>
            </div>
            <div className={styles.weekHeatRow}>
              {weekCells.map((cell) => {
                const completion = getCompletion(historyByDate.get(cell.key));
                const isSelected = cell.key === selectedDateKey;
                const level =
                  completion.rate >= 80
                    ? 4
                    : completion.rate >= 60
                    ? 3
                    : completion.rate >= 30
                    ? 2
                    : completion.rate > 0
                    ? 1
                    : 0;
                return (
                  <div key={cell.key} className={styles.weekHeatCellWrap}>
                    <span className={styles.weekHeatLabel}>{cell.label}</span>
                    <button
                      type="button"
                      className={`${styles.weekHeatCell} ${
                        styles[`heatLevel${level}`]
                      } ${isSelected ? styles.weekHeatCellSelected : ""}`}
                      onClick={() =>
                        setSelectedDate(new Date(`${cell.key}T00:00:00`))
                      }
                    >
                      <span className={styles.weekHeatDay}>{cell.day}</span>
                      <span className={styles.weekHeatCount}>
                        {completion.done}/{completion.total}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <ClipboardPen size={16} />
                {`${selectedDayLabel} 행동기록`}
              </h3>
            </div>
            {includedChecks.length === 0 ? (
              <p className={styles.empty}>
                기록에 포함된 체크가 없습니다. 제안에서 체크를 추가하세요.
              </p>
            ) : (
              <div className={styles.checkCardList}>
                {includedChecks.map((check) => (
                  <label key={check.checkId} className={styles.checkCardItem}>
                    <input
                      type="checkbox"
                      className={styles.checkInput}
                      checked={doneCheckIds.has(check.checkId)}
                      onChange={() => toggleDoneCheck(check.checkId)}
                    />
                    <span className={styles.checkIcon} aria-hidden>
                      {doneCheckIds.has(check.checkId) ? (
                        <CheckCircle2
                          size={18}
                          className={styles.checkStateIconDone}
                        />
                      ) : (
                        <Circle size={18} className={styles.checkStateIcon} />
                      )}
                    </span>
                    <span className={styles.checkLabelWrap}>
                      <span>{check.label}</span>
                      {check.isPinned ? (
                        <span className={styles.checkPinnedBadge}>
                          <Pin size={12} />
                          고정
                        </span>
                      ) : null}
                    </span>
                    {!check.isPinned ? (
                      <SafeButton
                        variant="unstyled"
                        className={styles.checkRemoveButton}
                        aria-label="체크 제거"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleOptionalCheck(check.checkId);
                        }}
                      >
                        <Trash2 size={15} />
                      </SafeButton>
                    ) : null}
                  </label>
                ))}
              </div>
            )}
            <div className={styles.formRow}>
              <textarea
                className={styles.textArea}
                value={comments}
                placeholder="느낀점을 기록하세요."
                onChange={(event) => setComments(event.target.value)}
              />
              <SafeButton
                loading={isSavingRecord}
                onClick={() => void handleSaveRecord()}
              >
                기록 저장
              </SafeButton>
            </div>
          </section>

          <section className={`${styles.section} ${styles.librarySection}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>오늘의 행동 제안</h3>
            </div>
            <p className={`${styles.sectionHint} ${styles.libraryNotice}`}>
              미고정 행동은 날짜가 지나면 자동으로 제거됩니다.
            </p>
            <div className={styles.libraryNoticeDivider} aria-hidden />
            {suggestionQuery.isLoading ? (
              <p className={styles.empty}>불러오는 중...</p>
            ) : (suggestionQuery.data ?? []).length === 0 ? (
              <p className={styles.empty}>제안된 행동이 없습니다.</p>
            ) : (
              <div className={styles.cardList}>
                {(suggestionQuery.data ?? []).map((detail) => (
                  <article key={detail.id} className={styles.behaviorCard}>
                    <div className={`${styles.row} ${styles.behaviorCardHeader}`}>
                      <h4 className={styles.behaviorTitle}>
                        {detail.behavior_label}
                      </h4>
                      <SafeButton
                        size="sm"
                        variant="unstyled"
                        className={`${styles.pinToggleButton} ${
                          detail.is_pinned
                            ? styles.pinToggleButtonActive
                            : styles.pinToggleButtonInactive
                        }`}
                        loading={Boolean(pinLoadingByDetailId[detail.id])}
                        onClick={() =>
                          void handleTogglePin(
                            detail.id,
                            Boolean(detail.is_pinned),
                          )
                        }
                      >
                        {detail.is_pinned ? (
                          <Pin size={14} />
                        ) : (
                          <PinOff size={14} />
                        )}
                        {detail.is_pinned ? "고정됨" : "미고정"}
                      </SafeButton>
                    </div>
                    <p className={styles.behaviorDesc}>
                      {detail.behavior_description}
                    </p>
                    <div className={styles.checkList}>
                      {(detail.checks ?? []).map((check) => {
                        const included = includedCheckIds.has(check.id);
                        const isPinned = Boolean(detail.is_pinned);
                        const isDone = doneCheckIds.has(check.id);
                        return (
                          <div
                            key={check.id}
                            className={styles.checkSuggestionRow}
                          >
                            {isPinned ? (
                              <span
                                className={`${styles.checkItem} ${
                                  included ? styles.checkItemOptionalIncluded : ""
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2
                                    size={16}
                                    className={styles.checkStateIconDone}
                                  />
                                ) : (
                                  <Circle
                                    size={16}
                                    className={styles.checkStateIcon}
                                  />
                                )}
                                {check.check_label}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.checkItem} ${
                                  included ? styles.checkItemOptionalIncluded : ""
                                } ${styles.checkItemToggle}`}
                                aria-pressed={included}
                                onClick={() => toggleOptionalCheck(check.id)}
                              >
                                {isDone ? (
                                  <CheckCircle2
                                    size={16}
                                    className={styles.checkStateIconDone}
                                  />
                                ) : (
                                  <Circle
                                    size={16}
                                    className={styles.checkStateIcon}
                                  />
                                )}
                                {check.check_label}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
