"use client";

import styles from "@/components/behavior/BehaviorPage.module.css";
import pageStyles from "@/app/page.module.css";
import AppHeader from "@/components/header/AppHeader";
import SafeButton from "@/components/ui/SafeButton";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { fetchBehaviorDetails } from "@/lib/api/emotion-behavior-details/getEmotionBehaviorDetails";
import { fetchBehaviorHistory } from "@/lib/api/emotion-behavior-history/getEmotionBehaviorHistory";
import { createBehaviorHistory } from "@/lib/api/emotion-behavior-history/postEmotionBehaviorHistory";
import { deleteBehaviorHistory } from "@/lib/api/emotion-behavior-history/deleteEmotionBehaviorHistory";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import { formatKoreanDateKey } from "@/lib/utils/time";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardPen,
  ListChecks,
  PencilLine,
  Trash2,
  Undo2,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CheckState = Record<number, boolean>;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateFromQuery = (raw: string | null) => {
  if (!raw || !DATE_KEY_PATTERN.test(raw)) return new Date();
  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function BehaviorTrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const behaviorDetailId = Number(searchParams.get("id") ?? "");
  const validBehaviorDetailId = Number.isFinite(behaviorDetailId) ? behaviorDetailId : null;

  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseDateFromQuery(searchParams.get("date")),
  );
  const [checkState, setCheckState] = useState<CheckState>({});
  const [comments, setComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<number | null>(null);

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  const detailQuery = useQuery({
    queryKey:
      validBehaviorDetailId && accessMode !== "blocked"
        ? queryKeys.behaviorDetail(access, validBehaviorDetailId)
        : ["noop"],
    queryFn: async () => {
      if (!validBehaviorDetailId) return null;
      const { response, data } = await fetchBehaviorDetails(access, {
        detailId: validBehaviorDetailId,
      });
      if (!response.ok) throw new Error("behavior detail fetch failed");
      return data.details[0] ?? null;
    },
    enabled: Boolean(validBehaviorDetailId) && !isLoading && accessMode !== "blocked",
  });

  const historyQuery = useQuery({
    queryKey:
      validBehaviorDetailId && accessMode !== "blocked"
        ? queryKeys.behaviorHistory(access, validBehaviorDetailId)
        : ["noop"],
    queryFn: async () => {
      if (!validBehaviorDetailId) return [];
      const { response, data } = await fetchBehaviorHistory(access, {
        behaviorDetailId: validBehaviorDetailId,
      });
      if (!response.ok) throw new Error("behavior history fetch failed");
      return data.histories;
    },
    enabled: Boolean(validBehaviorDetailId) && !isLoading && accessMode !== "blocked",
  });

  const selectedDateKey = formatKoreanDateKey(selectedDate);
  const selectedDateHistories = useMemo(
    () =>
      (historyQuery.data ?? []).filter((history) => history.tracked_on === selectedDateKey),
    [historyQuery.data, selectedDateKey],
  );
  const doneCount = (detailQuery.data?.checks ?? []).filter(
    (check) => checkState[check.id],
  ).length;
  const totalCount = detailQuery.data?.checks?.length ?? 0;

  const handleToggleCheck = (checkId: number) => {
    setCheckState((prev) => ({ ...prev, [checkId]: !prev[checkId] }));
  };

  const handleSave = async () => {
    if (!detailQuery.data) return;
    const checks = (detailQuery.data.checks ?? []).map((check) => ({
      check_id: check.id,
      is_done: Boolean(checkState[check.id]),
    }));

    setIsSaving(true);
    try {
      const response = await createBehaviorHistory(
        {
          behavior_detail_id: detailQuery.data.id,
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
        queryKey: queryKeys.behaviorHistory(access, detailQuery.data.id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.behaviorHistory(access) });
      await queryClient.invalidateQueries({ queryKey: ["emotion-behavior-library"] });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (deletingHistoryId != null || !detailQuery.data) return;
    setDeletingHistoryId(historyId);
    try {
      const response = await deleteBehaviorHistory({ id: historyId }, access);
      if (!response.ok) {
        pushToast("행동 기록 삭제에 실패했습니다.", "error");
        return;
      }
      pushToast("행동 기록을 삭제했습니다.", "success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.behaviorHistory(access, detailQuery.data.id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.behaviorHistory(access) });
      await queryClient.invalidateQueries({ queryKey: ["emotion-behavior-library"] });
    } finally {
      setDeletingHistoryId(null);
    }
  };

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          <section className={styles.hero}>
            <p className={styles.heroEyebrow}>Daily Tracking</p>
            <h2 className={styles.heroTitle}>{detailQuery.data?.behavior_label ?? "행동 기록"}</h2>
            <p className={styles.heroText}>
              날짜를 선택해서 체크 완료 여부와 코멘트를 기록하세요.
            </p>
            <div className={styles.metaRow}>
              <span className={styles.metaBadge}>
                <CheckCircle2 size={14} />
                진행률 {doneCount}/{totalCount}
              </span>
              <span className={styles.metaBadge}>
                <CalendarDays size={14} />
                {selectedDateKey}
              </span>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <CalendarDays size={16} />
                기록 날짜
              </h3>
              <p className={styles.sectionHint}>{selectedDateKey}</p>
            </div>
            <div className={styles.dayPickerWrap}>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(value) => {
                  if (value) setSelectedDate(value);
                }}
                className={styles.dayPickerWrap}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <ListChecks size={16} />
                체크리스트 수행
              </h3>
            </div>
            {(detailQuery.data?.checks ?? []).length === 0 ? (
              <p className={styles.empty}>이 행동에는 체크리스트가 없습니다.</p>
            ) : (
              <div className={styles.checkCardList}>
                {(detailQuery.data?.checks ?? []).map((check) => (
                  <label key={check.id} className={styles.checkCardItem}>
                    <input
                      type="checkbox"
                      className={styles.checkInput}
                      checked={Boolean(checkState[check.id])}
                      onChange={() => handleToggleCheck(check.id)}
                    />
                    <span className={styles.checkIcon} aria-hidden>
                      {Boolean(checkState[check.id]) ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </span>
                    {check.check_label}
                  </label>
                ))}
              </div>
            )}
            <div className={styles.formRow}>
              <p className={styles.checkBlockTitle}>
                <ClipboardPen size={14} />
                오늘 느낀점
              </p>
              <textarea
                className={styles.textArea}
                value={comments}
                placeholder="오늘 느낀 점을 남겨보세요."
                onChange={(event) => setComments(event.target.value)}
              />
              <SafeButton onClick={() => void handleSave()} loading={isSaving}>
                기록 저장
              </SafeButton>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <PencilLine size={16} />
                선택 날짜 기록
              </h3>
            </div>
            {selectedDateHistories.length === 0 ? (
              <p className={styles.empty}>선택한 날짜의 기록이 없습니다.</p>
            ) : (
              <div className={styles.cardList}>
                {selectedDateHistories.map((history) => (
                  <article key={history.id} className={styles.behaviorCard}>
                    <div className={styles.row}>
                      <p className={styles.meta}>#{history.id}</p>
                      <SafeButton
                        size="sm"
                        variant="ghost"
                        className={styles.deleteIconButton}
                        loading={deletingHistoryId === history.id}
                        onClick={() => void handleDeleteHistory(history.id)}
                      >
                        <Trash2 size={14} />
                      </SafeButton>
                    </div>
                    <div className={styles.checkList}>
                      {(detailQuery.data?.checks ?? []).map((check) => {
                        const matched = (history.checks ?? []).find(
                          (item) => item.check_id === check.id,
                        );
                        return (
                          <span key={`${history.id}-${check.id}`} className={styles.checkItem}>
                            {matched?.is_done ? "완료" : "미완료"} · {check.check_label}
                          </span>
                        );
                      })}
                    </div>
                    {history.comments ? <p className={styles.behaviorDesc}>{history.comments}</p> : null}
                  </article>
                ))}
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
