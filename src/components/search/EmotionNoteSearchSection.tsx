"use client";

import EmotionNoteListSection from "@/components/emotion-notes/EmotionNoteListSection";
import SafeButton from "@/components/ui/SafeButton";
import { fetchEmotionNoteSearchList } from "@/lib/api/search/getEmotionNoteSearchList";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateTime, getKstDayRange } from "@/lib/utils/time";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import styles from "./EmotionNoteSearchSection.module.css";
import DateRangeFilterPopover from "./DateRangeFilterPopover";

const buildRangeIso = (range?: DateRange) => {
  if (!range?.from && !range?.to) {
    return null;
  }
  const from = range?.from ?? range?.to ?? new Date();
  const to = range?.to ?? range?.from ?? new Date();
  const fromRange = getKstDayRange(from);
  const toRange = getKstDayRange(to);
  return {
    startIso: fromRange.startIso,
    endIso: toRange.endIso,
  };
};

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from && !range?.to) {
    return "기간을 선택하세요";
  }
  const from = range?.from ?? range?.to;
  const to = range?.to ?? range?.from;
  if (!from || !to) {
    return "기간을 선택하세요";
  }
  const fromLabel = formatKoreanDateTime(from, {
    month: "long",
    day: "numeric",
  });
  const toLabel = formatKoreanDateTime(to, { month: "long", day: "numeric" });
  if (fromLabel === toLabel) {
    return fromLabel;
  }
  return `${fromLabel} ~ ${toLabel}`;
};

type EmotionNoteSearchSectionProps = {
  access: AccessContext;
  onImportNote?: (note: EmotionNote) => void;
  importingNoteId?: number | null;
  excludeFlowId?: number | null;
};

export default function EmotionNoteSearchSection({
  access,
  onImportNote,
  importingNoteId,
  excludeFlowId,
}: EmotionNoteSearchSectionProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [submittedRange, setSubmittedRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const rangeIso = useMemo(
    () => buildRangeIso(submittedRange),
    [submittedRange],
  );
  const startIso = rangeIso?.startIso ?? "";
  const endIso = rangeIso?.endIso ?? "";
  const appliedRangeLabel = useMemo(
    () => formatRangeLabel(appliedRange),
    [appliedRange],
  );
  const draftRangeLabel = useMemo(
    () => formatRangeLabel(draftRange),
    [draftRange],
  );

  const notesQuery = useQuery({
    queryKey: queryKeys.emotionNotes.search(
      access,
      searchQuery,
      startIso,
      endIso,
      excludeFlowId,
    ),
    queryFn: async () => {
      const { response, data } = await fetchEmotionNoteSearchList(access, {
        query: searchQuery,
        start: submittedRange?.from ?? null,
        end: submittedRange?.to ?? null,
        excludeFlowId,
      });
      if (!response.ok) {
        throw new Error("emotion_notes_search failed");
      }
      return data.notes ?? [];
    },
    enabled: access.mode !== "blocked" && hasSubmitted,
  });

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const isLoading = notesQuery.isFetching && hasSubmitted;

  const submitSearch = (nextRange?: DateRange, nextQuery?: string) => {
    const trimmed = (nextQuery ?? searchInput).trim();
    const range = nextRange ?? appliedRange;
    if (!trimmed && !range?.from && !range?.to) {
      setHasSubmitted(false);
      setSearchQuery("");
      setSubmittedRange(undefined);
      return;
    }
    setSearchQuery(trimmed);
    setSubmittedRange(range);
    setHasSubmitted(true);
  };

  const handleSearch = () => {
    submitSearch(appliedRange, searchInput);
  };

  const handleRangeApply = () => {
    setAppliedRange(draftRange);
    setIsFilterOpen(false);
    submitSearch(draftRange, searchInput);
  };

  const handleRangeClear = () => {
    setDraftRange(undefined);
    setAppliedRange(undefined);
  };

  const getDetailHref = useMemo(
    () => (note: EmotionNote) => `/detail?id=${note.id}&from=search`,
    [],
  );
  const isImportMode = Boolean(onImportNote);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <SafeButton
          type="button"
          variant="ghost"
          className={styles.filterToggle}
          onClick={() => setIsFilterOpen((prev) => !prev)}
        >
          <CalendarDays size={16} />
          <span className={styles.filterLabel}>기간</span>
          {appliedRange?.from || appliedRange?.to ? (
            <span className={styles.appliedRange}>{appliedRangeLabel}</span>
          ) : null}
        </SafeButton>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchField}>
          <Search size={16} aria-hidden className={styles.searchIcon} />
          <input
            type="search"
            placeholder="검색어를 입력하세요"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className={styles.searchInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
          />
          <button
            type="button"
            className={styles.searchSubmit}
            onClick={handleSearch}
          >
            검색
          </button>
        </div>
      </div>

      <DateRangeFilterPopover
        isOpen={isFilterOpen}
        draftRange={draftRange}
        rangeLabel={draftRangeLabel}
        onSelect={setDraftRange}
        onApply={handleRangeApply}
        onClear={handleRangeClear}
        onClose={() => setIsFilterOpen(false)}
      />

      <EmotionNoteListSection
        title={
          hasSubmitted && notes.length > 0
            ? `검색 결과 ${notes.length}개의 기록이 있습니다`
            : undefined
        }
        notes={hasSubmitted ? notes : []}
        isLoading={isLoading}
        emptyTitle={
          isLoading
            ? "불러오는 중..."
            : hasSubmitted
              ? "검색 결과가 없습니다"
              : "검색어 또는 기간을 입력하세요"
        }
        emptyHint={
          hasSubmitted && !isLoading
            ? "다른 키워드나 기간으로 다시 검색해보세요"
            : null
        }
        getDetailHref={isImportMode ? undefined : getDetailHref}
        onImportNote={onImportNote}
        importingNoteId={importingNoteId}
      />
    </section>
  );
}
