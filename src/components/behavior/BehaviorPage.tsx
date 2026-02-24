"use client";

import pageStyles from "@/app/page.module.css";
import styles from "@/components/behavior/BehaviorPage.module.css";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import AppHeader from "@/components/header/AppHeader";
import { useCbtToast } from "@/components/session/common/CbtToast";
import SafeButton from "@/components/ui/SafeButton";
import { fetchBehaviorDetails } from "@/lib/api/emotion-behavior-details/getEmotionBehaviorDetails";
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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  ClipboardPen,
  Disc3,
  Download,
  FolderOpen,
  Plus,
  Pin,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CheckMeta = {
  checkId: number;
  label: string;
  detailId: number;
  isSavedSuggestion: boolean;
};

type BehaviorHistoryRow = {
  id: number;
  tracked_on: string;
  comments: string;
  created_at: string;
  checks?: Array<{ check_id: number; is_done: boolean; check_label?: string }>;
};

type BehaviorDetailRow = {
  id: number;
  behavior_label: string;
  behavior_description: string;
  is_pinned: boolean;
  created_at: string;
  checks?: Array<{ id: number; check_label: string }>;
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

const uniqueIds = (ids: number[]) => Array.from(new Set(ids));

export default function BehaviorPage() {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCheckIdsByDate, setSelectedCheckIdsByDate] = useState<
    Record<string, number[]>
  >({});
  const [doneCheckIds, setDoneCheckIds] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState("");
  const [historySyncKey, setHistorySyncKey] = useState("");
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const [isTrackingSetConfirmedByDate, setIsTrackingSetConfirmedByDate] =
    useState<Record<string, boolean>>({});
  const [isSavedSuggestionModalOpen, setIsSavedSuggestionModalOpen] =
    useState(false);
  const [importedDetailIdsByDate, setImportedDetailIdsByDate] = useState<
    Record<string, number[]>
  >({});
  const [modalSelectedDetailIds, setModalSelectedDetailIds] = useState<number[]>(
    [],
  );
  const [expandedModalDetailIds, setExpandedModalDetailIds] = useState<number[]>(
    [],
  );

  useModalOpen(isSavedSuggestionModalOpen);

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
      return data.histories as BehaviorHistoryRow[];
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
      return data.details as BehaviorDetailRow[];
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

  const suggestionDetails = useMemo(
    () => suggestionQuery.data ?? [],
    [suggestionQuery.data],
  );

  const detailDateKey = (createdAt: string) => formatKoreanDateKey(createdAt);
  const dailySuggestionDetails = useMemo(
    () =>
      suggestionDetails.filter(
        (detail) => detailDateKey(detail.created_at) === selectedDateKey,
      ),
    [selectedDateKey, suggestionDetails],
  );
  const savedSuggestionDetails = useMemo(
    () =>
      suggestionDetails.filter(
        (detail) =>
          Boolean(detail.is_pinned) && detailDateKey(detail.created_at) !== selectedDateKey,
      ),
    [selectedDateKey, suggestionDetails],
  );
  const importedDetailIds = useMemo(
    () => importedDetailIdsByDate[selectedDateKey] ?? [],
    [importedDetailIdsByDate, selectedDateKey],
  );
  const importedSuggestionDetails = useMemo(() => {
    const importedIdSet = new Set(importedDetailIds);
    return suggestionDetails.filter((detail) => importedIdSet.has(detail.id));
  }, [importedDetailIds, suggestionDetails]);
  const suggestionStageDetails = useMemo(() => {
    const merged = new Map<number, BehaviorDetailRow>();
    for (const detail of dailySuggestionDetails) {
      merged.set(detail.id, detail);
    }
    for (const detail of importedSuggestionDetails) {
      merged.set(detail.id, detail);
    }
    return Array.from(merged.values());
  }, [dailySuggestionDetails, importedSuggestionDetails]);
  const importedDetailIdSet = useMemo(
    () => new Set(importedDetailIds),
    [importedDetailIds],
  );

  const checkMetaById = useMemo(() => {
    const map = new Map<number, CheckMeta>();
    for (const detail of suggestionDetails) {
      for (const check of detail.checks ?? []) {
        map.set(check.id, {
          checkId: check.id,
          label: check.check_label,
          detailId: detail.id,
          isSavedSuggestion: Boolean(detail.is_pinned),
        });
      }
    }
    return map;
  }, [suggestionDetails]);

  const historyLabelByCheckId = useMemo(() => {
    const map = new Map<number, string>();
    for (const check of selectedHistory?.checks ?? []) {
      const label = (check.check_label ?? "").trim();
      if (label) map.set(check.check_id, label);
    }
    return map;
  }, [selectedHistory]);

  const historySelectedCheckIds = useMemo(
    () => uniqueIds((selectedHistory?.checks ?? []).map((check) => check.check_id)),
    [selectedHistory],
  );

  useEffect(() => {
    setIsSelectingSuggestion(false);
    setIsSavedSuggestionModalOpen(false);
    setModalSelectedDetailIds([]);
    setExpandedModalDetailIds([]);
  }, [selectedDateKey]);

  useEffect(() => {
    if (selectedCheckIdsByDate[selectedDateKey] !== undefined) return;
    if (historySelectedCheckIds.length === 0) return;
    setSelectedCheckIdsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: historySelectedCheckIds,
    }));
  }, [historySelectedCheckIds, selectedCheckIdsByDate, selectedDateKey]);

  const selectedCheckIds =
    selectedCheckIdsByDate[selectedDateKey] ?? historySelectedCheckIds;

  const hasTrackingSet = selectedCheckIds.length > 0;
  const isTrackingSetConfirmed =
    isTrackingSetConfirmedByDate[selectedDateKey] ?? historySelectedCheckIds.length > 0;
  const currentStep =
    isSelectingSuggestion || !hasTrackingSet || !isTrackingSetConfirmed
      ? "suggestion"
      : "tracking";

  useEffect(() => {
    const syncKey = `${selectedDateKey}:${selectedHistory?.id ?? "none"}`;
    if (historySyncKey === syncKey) return;

    const nextDone = new Set<number>();
    const selectedSet = new Set(selectedCheckIds);
    for (const check of selectedHistory?.checks ?? []) {
      if (!selectedSet.has(check.check_id)) continue;
      if (check.is_done) nextDone.add(check.check_id);
    }

    setDoneCheckIds(nextDone);
    setComments(selectedHistory?.comments ?? "");
    setHistorySyncKey(syncKey);
  }, [
    historySyncKey,
    selectedCheckIds,
    selectedDateKey,
    selectedHistory,
  ]);

  useEffect(() => {
    const selectedSet = new Set(selectedCheckIds);
    setDoneCheckIds((prev) => {
      const next = new Set<number>();
      for (const checkId of prev) {
        if (selectedSet.has(checkId)) next.add(checkId);
      }
      return next;
    });
  }, [selectedCheckIds]);

  const includedChecks = useMemo(() => {
    return selectedCheckIds.map((checkId) => {
      const meta = checkMetaById.get(checkId);
      return {
        checkId,
        label:
          meta?.label ?? historyLabelByCheckId.get(checkId) ?? `체크 #${checkId}`,
        isSavedSuggestion: Boolean(meta?.isSavedSuggestion),
      };
    });
  }, [checkMetaById, historyLabelByCheckId, selectedCheckIds]);

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

  const toggleSuggestionCheck = (checkId: number) => {
    setSelectedCheckIdsByDate((prev) => {
      const current = new Set(prev[selectedDateKey] ?? historySelectedCheckIds);
      if (current.has(checkId)) {
        current.delete(checkId);
      } else {
        current.add(checkId);
      }
      return {
        ...prev,
        [selectedDateKey]: Array.from(current),
      };
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
    if (selectedCheckIds.length === 0) {
      pushToast("기록할 체크리스트를 먼저 선택하세요.", "error");
      return;
    }

    const checks = selectedCheckIds.map((checkId) => ({
      check_id: checkId,
      is_done: doneCheckIds.has(checkId),
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
      setHistorySyncKey("");
    } finally {
      setIsSavingRecord(false);
    }
  };

  const toggleModalSuggestion = (detailId: number) => {
    setModalSelectedDetailIds((prev) =>
      prev.includes(detailId)
        ? prev.filter((id) => id !== detailId)
        : [...prev, detailId],
    );
  };

  const toggleModalDetailExpanded = (detailId: number) => {
    setExpandedModalDetailIds((prev) =>
      prev.includes(detailId)
        ? prev.filter((id) => id !== detailId)
        : [...prev, detailId],
    );
  };

  const handleImportSuggestions = () => {
    if (modalSelectedDetailIds.length === 0) return;

    setImportedDetailIdsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: uniqueIds([
        ...(prev[selectedDateKey] ?? []),
        ...modalSelectedDetailIds,
      ]),
    }));

    setIsSavedSuggestionModalOpen(false);
    setModalSelectedDetailIds([]);
    setExpandedModalDetailIds([]);
  };

  const renderSuggestionCard = (
    detail: BehaviorDetailRow,
    options?: { isImported?: boolean },
  ) => (
    <article key={detail.id} className={styles.behaviorCard}>
      <div className={`${styles.row} ${styles.behaviorCardHeader}`}>
        <h4 className={styles.behaviorTitle}>{detail.behavior_label}</h4>
        {options?.isImported ? (
          <span className={styles.importedBehaviorBadge}>
            <Pin size={13} />
            불러온 행동
          </span>
        ) : null}
      </div>
      <p className={styles.behaviorDesc}>{detail.behavior_description}</p>
      <div className={styles.checkList}>
        {(detail.checks ?? []).map((check) => {
          const included = selectedCheckIds.includes(check.id);
          return (
            <div key={check.id} className={styles.checkSuggestionRow}>
              <button
                type="button"
                className={`${styles.checkItem} ${
                  included ? styles.checkItemOptionalIncluded : ""
                } ${styles.checkItemToggle}`}
                aria-pressed={included}
                onClick={() => toggleSuggestionCheck(check.id)}
              >
                {included ? (
                  <Disc3
                    size={15}
                    className={styles.checkStateIconSuggestionSelected}
                  />
                ) : (
                  <Circle size={16} className={styles.checkStateIcon} />
                )}
                {check.check_label}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );

  const renderSavedSuggestionModalItem = (detail: BehaviorDetailRow) => {
    const selected = modalSelectedDetailIds.includes(detail.id);
    const expanded = expandedModalDetailIds.includes(detail.id);
    return (
      <article
        key={detail.id}
        className={`${styles.savedSuggestionModalItem} ${
          selected ? styles.savedSuggestionModalItemSelected : ""
        }`}
      >
        <div className={styles.savedSuggestionModalItemHeader}>
          <h5 className={styles.savedSuggestionModalItemTitle}>{detail.behavior_label}</h5>
          <SafeButton
            size="sm"
            variant="unstyled"
            className={`${styles.savedSuggestionModalSelectButton} ${
              selected ? styles.savedSuggestionModalSelectButtonActive : ""
            }`}
            onClick={() => toggleModalSuggestion(detail.id)}
          >
            {selected ? (
              <CheckCircle2 size={18} />
            ) : (
              <>
                <Plus size={14} />
                담기
              </>
            )}
          </SafeButton>
        </div>
        <div className={styles.savedSuggestionModalDescRow}>
          <p
            className={`${styles.savedSuggestionModalDesc} ${
              expanded ? styles.savedSuggestionModalDescExpanded : ""
            }`}
          >
            {detail.behavior_description}
          </p>
          <SafeButton
            size="sm"
            variant="ghost"
            className={styles.savedSuggestionModalToggleButton}
            onClick={() => toggleModalDetailExpanded(detail.id)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "접기" : "더보기"}
          </SafeButton>
        </div>
        <ul className={styles.savedSuggestionModalCheckList}>
          {(detail.checks ?? []).map((check) => (
            <li key={check.id} className={styles.savedSuggestionModalCheckItem}>
              {check.check_label}
            </li>
          ))}
        </ul>
      </article>
    );
  };

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          {currentStep === "tracking" ? (
            <>
              <section className={styles.heroPanel}>
                <div className={styles.heroHeader}>
                  <div>
                    <p className={styles.heroEyebrow}>Tracking Info</p>
                    <h2 className={styles.heroTitle}>행동 기록 추적</h2>
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

                <div className={`${styles.sectionHeader} ${styles.trackerDateHeader}`}>
                  <h3 className={`${styles.sectionTitle} ${styles.trackerDateTitle}`}>
                    {selectedDateKey}
                  </h3>
                  <SafeButton
                    variant="ghost"
                    className={styles.reselectButton}
                    onClick={() => setIsSelectingSuggestion(true)}
                  >
                    <RefreshCcw size={14} />
                    행동 제안 다시 선택
                  </SafeButton>
                </div>

                <div className={styles.weekHeatRow}>
                  {weekCells.map((cell) => {
                    const completion = getCompletion(historyByDate.get(cell.key));
                    const isSelected = cell.key === selectedDateKey;
                    const isFuture = cell.key > todayKey;
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
                          disabled={isFuture}
                          className={`${styles.weekHeatCell} ${
                            styles[`heatLevel${level}`]
                          } ${isSelected ? styles.weekHeatCellSelected : ""} ${
                            isFuture ? styles.weekHeatCellDisabled : ""
                          }`}
                          onClick={() => setSelectedDate(new Date(`${cell.key}T00:00:00`))}
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
                    {`${selectedDayLabel} 행동 기록`}
                  </h3>
                </div>
                {includedChecks.length === 0 ? (
                  <p className={styles.empty}>
                    선택된 체크리스트가 없습니다. 행동 제안 선택 단계로 돌아가세요.
                  </p>
                ) : (
                  <div className={styles.checkCardList}>
                    {includedChecks.map((check) => (
                      <label
                        key={check.checkId}
                        className={`${styles.checkCardItem} ${
                          doneCheckIds.has(check.checkId) ? styles.checkCardItemDone : ""
                        }`}
                      >
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
                              className={styles.checkStateIconHistoryDone}
                            />
                          ) : (
                            <Circle size={18} className={styles.checkStateIcon} />
                          )}
                        </span>
                        <span className={styles.checkLabelWrap}>
                          <span>{check.label}</span>
                        </span>
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
            </>
          ) : (
            <section className={styles.suggestionStage}>
              <div className={`${styles.sectionHeader} ${styles.suggestionTitleRow}`}>
                <h3 className={styles.sectionTitle}>오늘의 행동 제안</h3>
                <SafeButton
                  size="sm"
                  variant="unstyled"
                  className={styles.openImportModalButton}
                  onClick={() => {
                    setModalSelectedDetailIds(importedDetailIdsByDate[selectedDateKey] ?? []);
                    setExpandedModalDetailIds([]);
                    setIsSavedSuggestionModalOpen(true);
                  }}
                >
                  <FolderOpen size={14} />
                  불러오기
                </SafeButton>
              </div>

              <div className={styles.libraryNoticeDivider} aria-hidden />
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionSubTitle}>{selectedDayLabel}</h4>
              </div>
              {suggestionQuery.isLoading ? (
                <p className={styles.plainEmpty}>불러오는 중...</p>
              ) : suggestionStageDetails.length === 0 ? (
                <p className={styles.plainEmpty}>오늘의 제안이 없습니다.</p>
              ) : (
                <div className={styles.cardList}>
                  {suggestionStageDetails.map((detail) =>
                    renderSuggestionCard(detail, {
                      isImported: importedDetailIdSet.has(detail.id),
                    }),
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      {currentStep === "suggestion" ? (
        <>
          <FloatingActionButton
            label="다음"
            icon={<ChevronRight size={22} />}
            helperText="진행"
            placement="tab"
            className={styles.fabRight}
            disabled={selectedCheckIds.length === 0}
            onClick={() => {
              setIsTrackingSetConfirmedByDate((prev) => ({
                ...prev,
                [selectedDateKey]: true,
              }));
              setIsSelectingSuggestion(false);
            }}
          />
        </>
      ) : null}
      {isSavedSuggestionModalOpen ? (
        <div
          className={styles.savedSuggestionModalOverlay}
          role="presentation"
          onClick={() => setIsSavedSuggestionModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="저장된 행동 제안 불러오기"
            className={styles.savedSuggestionModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.savedSuggestionModalHeader}>
              <h4 className={styles.sectionTitle}>저장된 행동 제안</h4>
              <SafeButton
                size="sm"
                variant="ghost"
                onClick={() => setIsSavedSuggestionModalOpen(false)}
              >
                닫기
              </SafeButton>
            </div>
            {savedSuggestionDetails.length === 0 ? (
              <p className={styles.plainEmpty}>저장된 행동 제안이 없습니다.</p>
            ) : (
              <div className={styles.savedSuggestionModalList}>
                {savedSuggestionDetails.map((detail) =>
                  renderSavedSuggestionModalItem(detail),
                )}
              </div>
            )}
          </div>
          <FloatingActionButton
            label="가져오기"
            icon={<Download size={22} />}
            helperText="가져오기"
            placement="tab"
            hideWhenModalOpen={false}
            disabled={modalSelectedDetailIds.length === 0}
            onClick={handleImportSuggestions}
          />
        </div>
      ) : null}
    </div>
  );
}
