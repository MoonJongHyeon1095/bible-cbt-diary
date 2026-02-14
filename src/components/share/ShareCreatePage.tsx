"use client";

import pageStyles from "@/app/page.module.css";
import { useCbtToast } from "@/components/session/common/CbtToast";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import SafeButton from "@/components/ui/SafeButton";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { createShareSnapshot } from "@/lib/api/share/postShareSnapshot";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./SharePage.module.css";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";

const SECTION_LABELS = {
  thought: "자동 사고",
  error: "인지 오류",
  alternative: "대안 사고",
  behavior: "행동 반응",
} as const;

type SectionKey = keyof typeof SECTION_LABELS;

type ShareSelection = {
  thought: number[];
  error: number[];
  alternative: number[];
  behavior: number[];
};

export default function ShareCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthModal } = useAuthModal();
  const { pushToast } = useCbtToast();
  const { accessMode, accessToken, isBlocked } = useAccessContext();
  const idParam = searchParams.get("id");
  const noteId = idParam ? Number(idParam) : null;

  const access = useMemo<AccessContext>(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );
  const noteQuery = useQuery({
    queryKey:
      noteId && access.mode === "auth"
        ? queryKeys.emotionNotes.detail(access, noteId)
        : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return null;
      }
      const { response, data } = await fetchEmotionNote(noteId, access);
      if (!response.ok || !data.note) {
        throw new Error("emotion_note fetch failed");
      }
      return data.note;
    },
    enabled: Boolean(noteId) && access.mode === "auth",
  });

  const note = noteQuery.data ?? null;
  const isLoading = noteQuery.isPending || noteQuery.isFetching;
  const details = useMemo(
    () => ({
      thought: note?.thought_details ?? [],
      error: note?.error_details ?? [],
      alternative: note?.alternative_details ?? [],
      behavior: note?.behavior_details ?? [],
    }),
    [note],
  );
  const noteTitle = note?.title ?? "";
  const triggerText = note?.trigger_text ?? "";
  const [selection, setSelection] = useState<ShareSelection>({
    thought: [],
    error: [],
    alternative: [],
    behavior: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalAvailable = useMemo(
    () =>
      details.thought.length +
      details.error.length +
      details.alternative.length +
      details.behavior.length,
    [details],
  );

  const totalSelected = useMemo(
    () =>
      selection.thought.length +
      selection.error.length +
      selection.alternative.length +
      selection.behavior.length,
    [selection],
  );

  const selectAll = useCallback(() => {
    setSelection({
      thought: details.thought.map((item) => item.id),
      error: details.error.map((item) => item.id),
      alternative: details.alternative.map((item) => item.id),
      behavior: details.behavior.map((item) => item.id),
    });
  }, [details]);

  const clearAll = useCallback(() => {
    setSelection({ thought: [], error: [], alternative: [], behavior: [] });
  }, []);

  const isAllSelected = totalAvailable > 0 && totalSelected === totalAvailable;

  useEffect(() => {
    if (!noteId || Number.isNaN(noteId)) {
      setError("공유할 기록을 찾을 수 없습니다.");
      return;
    }
    if (noteQuery.isError) {
      setError("기록을 불러오지 못했습니다.");
    }
  }, [noteId, noteQuery.isError]);

  const toggleItem = (section: SectionKey, id: number) => {
    setSelection((prev) => {
      const items = prev[section];
      if (items.includes(id)) {
        return { ...prev, [section]: items.filter((itemId) => itemId !== id) };
      }
      return { ...prev, [section]: [...items, id] };
    });
  };

  const toggleSectionAll = (section: SectionKey) => {
    setSelection((prev) => {
      const allIds = details[section].map((item) => item.id);
      const isFull =
        prev[section].length === allIds.length && allIds.length > 0;
      return { ...prev, [section]: isFull ? [] : allIds };
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!noteId || Number.isNaN(noteId)) {
        throw new Error("invalid note");
      }
      if (accessMode !== "auth" || !accessToken) {
        throw new Error("auth required");
      }
      return createShareSnapshot({
        accessToken,
        noteId,
        selectedThoughtIds: selection.thought,
        selectedErrorIds: selection.error,
        selectedAlternativeIds: selection.alternative,
        selectedBehaviorIds: selection.behavior,
      });
    },
  });

  const handleCreate = async () => {
    setError("");
    if (!noteId || Number.isNaN(noteId)) {
      setError("공유할 기록을 찾을 수 없습니다.");
      return;
    }
    if (accessMode !== "auth" || !accessToken) {
      setError("로그인이 필요합니다.");
      openAuthModal();
      return;
    }
    if (totalSelected === 0) {
      setError("공유할 항목을 최소 1개 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { response, data } = await createMutation.mutateAsync();
      if (!response.ok || !data.ok || !data.publicId) {
        setError(data.message ?? "공유 링크 생성에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }
      router.push(`/share/link?sid=${data.publicId}&noteId=${noteId}`);
    } catch {
      setError("공유 링크 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItems = (section: SectionKey) => {
    if (section === "thought") {
      const items = details.thought;
      if (items.length === 0) {
        return <p className={styles.emptyState}>등록된 항목이 없습니다.</p>;
      }
      return (
        <div className={styles.itemList}>
          {items.map((item) => (
            <label key={item.id} className={styles.itemCard}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selection.thought.includes(item.id)}
                onChange={() => toggleItem("thought", item.id)}
              />
              <div className={styles.itemBody}>
                <span className={`${styles.badgePill} ${styles.badgeThought}`}>
                  감정: {item.emotion || "-"}
                </span>
                <p className={styles.itemText}>
                  {item.automatic_thought || "-"}
                </p>
              </div>
            </label>
          ))}
        </div>
      );
    }
    if (section === "error") {
      const items = details.error;
      if (items.length === 0) {
        return <p className={styles.emptyState}>등록된 항목이 없습니다.</p>;
      }
      return (
        <div className={styles.itemList}>
          {items.map((item) => (
            <label key={item.id} className={styles.itemCard}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selection.error.includes(item.id)}
                onChange={() => toggleItem("error", item.id)}
              />
              <div className={styles.itemBody}>
                <span className={`${styles.badgePill} ${styles.badgeError}`}>
                  {item.error_label || "-"}
                </span>
                <p className={styles.itemText}>
                  {item.error_description || "-"}
                </p>
              </div>
            </label>
          ))}
        </div>
      );
    }
    if (section === "alternative") {
      const items = details.alternative;
      if (items.length === 0) {
        return <p className={styles.emptyState}>등록된 항목이 없습니다.</p>;
      }
      return (
        <div className={styles.itemList}>
          {items.map((item) => (
            <label key={item.id} className={styles.itemCard}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selection.alternative.includes(item.id)}
                onChange={() => toggleItem("alternative", item.id)}
              />
              <div className={styles.itemBody}>
                <p className={styles.itemText}>{item.alternative || "-"}</p>
              </div>
            </label>
          ))}
        </div>
      );
    }
    const items = details.behavior;
    if (items.length === 0) {
      return <p className={styles.emptyState}>등록된 항목이 없습니다.</p>;
    }
    return (
      <div className={styles.itemList}>
        {items.map((item) => (
          <label key={item.id} className={styles.itemCard}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={selection.behavior.includes(item.id)}
              onChange={() => toggleItem("behavior", item.id)}
            />
              <div className={styles.itemBody}>
                <span className={`${styles.badgePill} ${styles.badgeBehavior}`}>
                  {item.behavior_label || "-"}
                </span>
                <p className={styles.itemText}>
                  {item.behavior_description || "-"}
                </p>
              {item.error_tags && item.error_tags.length > 0 ? (
                <div className={styles.tagList}>
                  {item.error_tags.map((tag) => (
                    <span key={`${item.id}-${tag}`} className={styles.tagChip}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </label>
        ))}
      </div>
    );
  };

  if (accessMode !== "auth" || !accessToken) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div className={pageStyles.shell}>
            <div className={pageStyles.emptyAuth}>
              <h2 className={pageStyles.emptyAuthTitle}>로그인이 필요합니다</h2>
              <p className={pageStyles.emptyAuthHint}>
                공유 링크 생성은 로그인 후 사용할 수 있습니다.
              </p>
              <div className={styles.actions}>
                <SafeButton type="button" variant="primary" onClick={openAuthModal}>
                  로그인하기
                </SafeButton>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className={pageStyles.page}>
        <main className={pageStyles.main}>
          <div className={pageStyles.shell}>
            <div className={pageStyles.emptyAuth}>
              <h2 className={pageStyles.emptyAuthTitle}>
                접근이 제한되었습니다
              </h2>
              <p className={pageStyles.emptyAuthHint}>
                현재는 공유 기능을 사용할 수 없습니다.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${pageStyles.page} ${styles.pageScrollPad}`}>
      <main className={pageStyles.main}>
        <div className={pageStyles.shell}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>공유할 내용을 선택하세요</h1>
              <p className={styles.subtitle}>
                제목과 트리거 텍스트는 항상 포함됩니다.
              </p>
            </div>
            {totalAvailable > 0 ? (
              <label className={styles.selectAll}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isAllSelected}
                  onChange={() => (isAllSelected ? clearAll() : selectAll())}
                />
                전체 선택
              </label>
            ) : null}
          </header>

          <section className={styles.noteCard}>
            <h2 className={styles.noteTitle}>{noteTitle || "제목 없음"}</h2>
            <p className={styles.noteText}>{triggerText || "트리거 없음"}</p>
          </section>

          {error ? <p className={styles.hint}>{error}</p> : null}

          {isLoading ? (
            <p className={styles.hint}>불러오는 중...</p>
          ) : (
            <>
              {(Object.keys(SECTION_LABELS) as SectionKey[]).map((section) => (
                <section key={section} className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>
                        {SECTION_LABELS[section]}
                      </h3>
                      <span className={styles.sectionMeta}>
                        {details[section].length}개 항목
                      </span>
                    </div>
                    {details[section].length > 0 ? (
                      <label className={styles.selectAll}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={
                            selection[section].length ===
                            details[section].length
                          }
                          onChange={() => toggleSectionAll(section)}
                        />
                        전체 선택
                      </label>
                    ) : null}
                  </div>
                  {renderItems(section)}
                </section>
              ))}
            </>
          )}

          {error ? <p className={styles.hint}>{error}</p> : null}
        </div>
      </main>
      <FloatingActionButton
        label="이전으로"
        icon={<ArrowLeft size={22} />}
        helperText="이전으로"
        onClick={() => router.back()}
        className={styles.fabLeft}
        style={{
          bottom: "18vh",
          ["--fab-bottom-mobile" as string]: "22vh",
        }}
      />
      <FloatingActionButton
        label="공유 링크 생성"
        icon={<Share2 size={22} />}
        helperText="공유 링크 생성"
        onClick={() => {
          if (totalSelected === 0) {
            pushToast("공유할 항목을 최소 1개 선택해주세요.", "error");
            return;
          }
          handleCreate();
        }}
        loading={isSubmitting}
        loadingText="생성 중..."
        loadingBehavior="replace"
        disabled={isSubmitting}
        className={styles.fabRight}
        style={{
          bottom: "18vh",
          ["--fab-bottom-mobile" as string]: "22vh",
        }}
      />
    </div>
  );
}
