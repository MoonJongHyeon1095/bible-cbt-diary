"use client";

import type { SessionHistory } from "@/lib/cbtTypes";
import { normalizeSelectedCognitiveErrors } from "@/lib/normalizeSelectedCognitiveErrors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatKoreanDateTime } from "@/lib/time";
import { ChevronDown, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import SessionHistorySectionCard, {
  SessionHistoryChip,
  SessionHistoryChipRow,
  SessionHistorySectionItalic,
  SessionHistorySectionText,
} from "./SessionHistorySectionCard";
import styles from "./SessionHistorySection.module.css";
import {
  deleteAllSessionHistories,
  deleteSessionHistory,
  fetchSessionHistories,
} from "./utils/sessionHistoryApi";

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

export default function SessionHistorySection() {
  const [histories, setHistories] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const loadHistories = async () => {
    setLoading(true);
    setNotice(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setHistories([]);
      setLoading(false);
      return;
    }

    const { response, data } = await fetchSessionHistories(accessToken);
    if (!response.ok) {
      setNotice("세션 기록을 불러오지 못했습니다.");
      setHistories([]);
      setLoading(false);
      return;
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
    setHistories(normalized);
    setLoading(false);
  };

  useEffect(() => {
    loadHistories();
  }, []);

  const handleDelete = async (id: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return;

    setDeletingId(id);
    const { response } = await deleteSessionHistory(accessToken, id);
    if (!response.ok) {
      setNotice("세션 기록을 삭제하지 못했습니다.");
      setDeletingId(null);
      return;
    }
    setHistories((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return;

    setDeletingAll(true);
    const { response } = await deleteAllSessionHistories(accessToken);
    if (!response.ok) {
      setNotice("세션 기록을 삭제하지 못했습니다.");
      setDeletingAll(false);
      return;
    }
    setHistories([]);
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={loading || histories.length === 0}
          >
            전체 삭제
          </Button>
        </div>
      </div>

      {confirmDeleteAll && (
        <div className={styles.confirmBar}>
          <span>이전 세션 기록이 모두 삭제됩니다.</span>
          <div className={styles.actions}>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAll}
              loading={deletingAll}
              loadingText="삭제 중..."
              disabled={loading || deletingAll}
            >
              삭제
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteAll(false)}
              disabled={loading || deletingAll}
            >
              취소
            </Button>
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
                <Button
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
                </Button>
                <Button
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
                </Button>
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
                            <SessionHistoryChip>{pair.emotion}</SessionHistoryChip>
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
                            <SessionHistoryChip>{error.title}</SessionHistoryChip>
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
                          {formatScriptureReference(history.bibleVerse) || "말씀"}
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
    </section>
  );
}
