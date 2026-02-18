"use client";

import styles from "@/components/behavior/BehaviorPage.module.css";
import pageStyles from "@/app/page.module.css";
import AppHeader from "@/components/header/AppHeader";
import SafeButton from "@/components/ui/SafeButton";
import { CbtLoadingState } from "@/components/session/common/CbtLoadingState";
import { createBehaviorDetail } from "@/lib/api/emotion-behavior-details/postEmotionBehaviorDetails";
import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import {
  generateBehaviorSuggestionsWithChecks,
  pickBehaviorsForErrorLabel,
} from "@/lib/gpt/behaviorSuggestion";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { useStorageBlockedRedirect } from "@/lib/hooks/useStorageBlockedRedirect";
import { queryKeys } from "@/lib/queryKeys";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CheckCircle2, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BehaviorSuggestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get("noteId") ?? "");
  const validNoteId = Number.isFinite(noteId) ? noteId : null;
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const { pushToast } = useCbtToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingByIndex, setSavingByIndex] = useState<Record<number, boolean>>({});
  const [savedByIndex, setSavedByIndex] = useState<Record<number, boolean>>({});
  const [suggestions, setSuggestions] = useState<
    Array<{
      behaviorId: string;
      label: string;
      suggestion: string;
      checks: string[];
    }>
  >([]);

  useStorageBlockedRedirect({
    enabled: !isLoading && accessMode === "blocked",
  });

  const noteQuery = useQuery({
    queryKey:
      validNoteId && accessMode !== "blocked"
        ? queryKeys.emotionNotes.detail(access, validNoteId)
        : ["noop"],
    queryFn: async () => {
      if (!validNoteId) return null;
      const { response, data } = await fetchEmotionNote(validNoteId, access);
      if (!response.ok) throw new Error("emotion-note fetch failed");
      return data.note;
    },
    enabled: Boolean(validNoteId) && !isLoading && accessMode !== "blocked",
  });

  const selectedErrorLabel = noteQuery.data?.error_label ?? "";
  const note = noteQuery.data;
  const hasSavedAny = useMemo(
    () => Object.values(savedByIndex).some(Boolean),
    [savedByIndex],
  );

  useEffect(() => {
    if (isLoading || accessMode === "blocked" || !selectedErrorLabel || !note) return;
    let isCancelled = false;

    const run = async () => {
      setIsGenerating(true);
      try {
        const behaviors = pickBehaviorsForErrorLabel(selectedErrorLabel);
        const errorMeta = COGNITIVE_ERRORS.find((item) => item.title === selectedErrorLabel);
        const generated = await generateBehaviorSuggestionsWithChecks({
          situation: note.trigger_text ?? "",
          emotionTags: note.emotion_tags ?? [],
          thought: note.inner_belief ?? "",
          alternativeThought: note.alternative ?? "",
          errorLabel: selectedErrorLabel,
          errorDescription: errorMeta?.description ?? "",
          behaviors,
          noteProposal: false,
        });
        if (isCancelled) return;
        const mapped = generated.map((item) => {
          const behavior = COGNITIVE_BEHAVIORS.find((row) => row.id === item.behaviorId);
          return {
            behaviorId: item.behaviorId,
            label: behavior?.replacement_title ?? item.behaviorId,
            suggestion: item.suggestion,
            checks: item.checks,
          };
        });
        setSuggestions(mapped);
      } catch {
        if (!isCancelled) pushToast("행동 제안 생성에 실패했습니다.", "error");
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [selectedErrorLabel, isLoading, accessMode, pushToast, note]);

  const handleSave = async (
    item: { label: string; suggestion: string; checks: string[] },
    index: number,
  ) => {
    if (savedByIndex[index]) return;
    setSavingByIndex((prev) => ({ ...prev, [index]: true }));
    try {
      const response = await createBehaviorDetail(
        {
          behavior_label: item.label,
          behavior_description: item.suggestion,
          checks: item.checks,
        },
        access,
      );
      if (!response.ok) {
        pushToast("행동 저장에 실패했습니다.", "error");
        return;
      }
      setSavedByIndex((prev) => ({ ...prev, [index]: true }));
      pushToast("행동과 체크리스트를 저장했습니다.", "success");
      await queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLibrary(access) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
    } finally {
      setSavingByIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className={`${pageStyles.page} ${styles.pageRoot}`}>
      <AppHeader />
      <main className={pageStyles.main}>
        <div className={`${pageStyles.shell} ${styles.shell}`}>
          <section className={styles.hero}>
            <p className={styles.heroEyebrow}>Behavior Coach</p>
            <h2 className={styles.heroTitle}>AI 행동 제안 생성</h2>
            <p className={styles.heroText}>
              이 노트의 인지오류에 맞는 행동 제안과 체크리스트를 생성합니다.
            </p>
            <div className={styles.errorTagRow}>
              <span className={`${styles.errorTag} ${styles.errorTagActive}`}>
                {selectedErrorLabel || "인지오류 없음"}
              </span>
            </div>
          </section>

          <section className={`${styles.section} ${styles.dateHistoryListSection}`}>
            {isGenerating ? (
              <CbtLoadingState message="행동 제안을 생성하고 있어요." />
            ) : suggestions.length === 0 ? (
              <p className={styles.empty}>아직 생성된 제안이 없습니다.</p>
            ) : (
              <div className={styles.cardList}>
                {suggestions.map((item, index) => (
                  <article key={`${item.behaviorId}-${index}`} className={styles.behaviorCard}>
                    <h4 className={styles.behaviorTitle}>
                      <BadgeCheck size={16} />
                      {item.label}
                    </h4>
                    <p className={styles.behaviorDesc}>{item.suggestion}</p>
                    <div className={styles.checkBlock}>
                      <p className={styles.checkBlockTitle}>
                        <ListChecks size={14} />
                        체크리스트
                      </p>
                      <div className={styles.checkList}>
                      {item.checks.map((check, checkIndex) => (
                        <span className={styles.checkItem} key={`${item.behaviorId}-${checkIndex}`}>
                          <CheckCircle2 size={14} />
                          {check}
                        </span>
                      ))}
                    </div>
                    </div>
                    <SafeButton
                      onClick={() => {
                        void handleSave(item, index);
                      }}
                      loading={Boolean(savingByIndex[index])}
                      disabled={Boolean(savedByIndex[index])}
                    >
                      {savedByIndex[index] ? (
                        <>
                          <CheckCircle2 size={14} />
                          저장됨
                        </>
                      ) : (
                        "선택 저장"
                      )}
                    </SafeButton>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      {hasSavedAny ? (
        <SafeButton
          variant="unstyled"
          className={styles.suggestionNextFab}
          onClick={() => router.push("/behavior")}
          aria-label="행동 탭으로 이동"
        >
          <ArrowRight size={22} />
        </SafeButton>
      ) : null}
    </div>
  );
}
