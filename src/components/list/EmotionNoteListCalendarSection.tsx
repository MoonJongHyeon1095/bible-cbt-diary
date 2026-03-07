"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import SearchInputField from "@/components/common/SearchInputField";
import EmotionNoteListSection from "@/components/emotion-notes/EmotionNoteListSection";
import SafeButton from "@/components/ui/SafeButton";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/utils/time";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EmotionNoteListCalendarSection.module.css";
import { fetchEmotionNoteListByRange } from "@/lib/api/emotion-notes/getEmotionNoteListByRange";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type DayCell = {
  date: Date;
  inMonth: boolean;
};

const buildCalendar = (baseDate: Date): DayCell[] => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDay);
  const cells: DayCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
    });
  }

  return cells;
};

const formatDateKey = (date: Date) => formatKoreanDateKey(date);

type EmotionNoteListCalendarSectionProps = {
  access: AccessContext;
  initialSelectedDate?: Date | null;
};

export default function EmotionNoteListCalendarSection({
  access,
  initialSelectedDate = null,
}: EmotionNoteListCalendarSectionProps) {
  const router = useRouter();
  const { checkUsage } = useAiUsageGuard({
    enabled: false,
    cache: true,
    redirectTo: null,
  });
  const initialMonth = initialSelectedDate ?? new Date();
  const [currentMonth, setCurrentMonth] = useState(() => initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () => initialSelectedDate,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddLoading, setIsAddLoading] = useState(false);
  const listHeaderRef = useRef<HTMLDivElement | null>(null);

  const monthLabel = useMemo(
    () =>
      formatKoreanDateTime(currentMonth, {
        year: "numeric",
        month: "long",
      }),
    [currentMonth],
  );
  const searchPlaceholder = useMemo(
    () =>
      `${formatKoreanDateTime(currentMonth, {
        month: "long",
      })} 기록 중 검색`,
    [currentMonth],
  );

  const days = useMemo(() => buildCalendar(currentMonth), [currentMonth]);
  const initialDateKey = useMemo(
    () => (initialSelectedDate ? formatKoreanDateKey(initialSelectedDate) : ""),
    [initialSelectedDate],
  );

  useEffect(() => {
    if (!initialSelectedDate) {
      return;
    }
    setSelectedDate(initialSelectedDate);
    setCurrentMonth(initialSelectedDate);
  }, [initialSelectedDate, initialDateKey]);

  const rangeStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth],
  );
  const rangeEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    [currentMonth],
  );

  const notesQuery = useQuery({
    queryKey: queryKeys.emotionNotes.range(
      access,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
    ),
    queryFn: async () => {
      const { response, data } = await fetchEmotionNoteListByRange(
        rangeStart,
        rangeEnd,
        access,
      );
      if (!response.ok) {
        throw new Error("emotion_notes_range fetch failed");
      }
      return data.notes ?? [];
    },
    enabled: access.mode !== "blocked",
  });

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const isLoading = notesQuery.isPending || notesQuery.isFetching;

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) => {
      const key = formatKoreanDateKey(note.created_at);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [notes]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }
    return notes.filter((note) => {
      const title = note.title?.toLowerCase() ?? "";
      const trigger = note.trigger_text?.toLowerCase() ?? "";
      return (
        title.includes(normalizedQuery) || trigger.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, notes]);

  const selectedNotes = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const key = formatDateKey(selectedDate);
    return notes.filter((note) => formatKoreanDateKey(note.created_at) === key);
  }, [notes, selectedDate]);

  const selectedLabel = useMemo(() => {
    if (normalizedQuery) {
      return searchResults.length > 0
        ? `검색 결과 ${searchResults.length}개의 기록이 있습니다`
        : "";
    }
    if (!selectedDate) {
      return "날짜를 선택하세요";
    }
    const dateLabel = formatKoreanDateTime(selectedDate, {
      month: "long",
      day: "numeric",
    });
    return selectedNotes.length > 0
      ? `${dateLabel} ${selectedNotes.length}개의 기록이 있습니다`
      : "";
  }, [
    normalizedQuery,
    searchResults.length,
    selectedDate,
    selectedNotes.length,
  ]);

  useEffect(() => {
    if (!selectedDate || selectedNotes.length === 0) {
      return;
    }
    if (normalizedQuery) {
      return;
    }
    listHeaderRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [normalizedQuery, selectedDate, selectedNotes.length]);

  useEffect(() => {
    if (!normalizedQuery) {
      return;
    }
    listHeaderRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [normalizedQuery]);

  useEffect(() => {
    if (access.mode === "blocked") {
      return;
    }
  }, [access.mode]);

  const visibleNotes = normalizedQuery ? searchResults : selectedNotes;
  const getDetailHref = useMemo(
    () => (note: EmotionNote) => {
      const dateKey = selectedDate
        ? formatKoreanDateKey(selectedDate)
        : formatKoreanDateKey(note.created_at);
      return `/detail?id=${note.id}&from=list&date=${dateKey}`;
    },
    [selectedDate],
  );
  const applySearch = () => {
    const trimmed = searchInput.trim();
    setSearchQuery(trimmed);
    if (trimmed) {
      setSelectedDate(null);
    }
  };
  const todayKey = formatDateKey(new Date());
  const selectedKey = selectedDate ? formatDateKey(selectedDate) : todayKey;
  const isFutureSelected = selectedKey > todayKey;
  const getHeatClass = (count: number) => {
    if (count >= 5) {
      return styles.cellHeat4;
    }
    if (count >= 3) {
      return styles.cellHeat3;
    }
    if (count >= 2) {
      return styles.cellHeat2;
    }
    if (count >= 1) {
      return styles.cellHeat1;
    }
    return "";
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>기록 목록</p>
          <h2 className={styles.title}>{monthLabel}</h2>
        </div>
        <div className={styles.controls}>
          <SafeButton
            type="button"
            variant="ghost"
            size="icon"
            className={styles.iconButton}
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                ),
              )
            }
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </SafeButton>
          <SafeButton
            type="button"
            variant="ghost"
            size="icon"
            className={styles.iconButton}
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                ),
              )
            }
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </SafeButton>
        </div>
      </header>

      <div className={styles.weekRow}>
        {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid} data-tour="list-calendar">
        {days.map((day) => {
          const key = formatDateKey(day.date);
          const count = countsByDate.get(key) ?? 0;
          const isToday = key === formatDateKey(new Date());
          const isSelected =
            selectedDate && key === formatDateKey(selectedDate);
          return (
            <SafeButton
              key={key}
              type="button"
              variant="unstyled"
              className={[
                styles.cell,
                getHeatClass(count),
                day.inMonth ? styles.cellInMonth : styles.cellOut,
                isToday ? styles.cellToday : "",
                isSelected && !normalizedQuery ? styles.cellSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (normalizedQuery || searchInput) {
                  setSearchQuery("");
                  setSearchInput("");
                }
                setSelectedDate(day.date);
              }}
            >
              <span className={styles.dayNumber}>{day.date.getDate()}</span>
              {count > 0 ? (
                <span className={styles.countNumber}>{count}</span>
              ) : null}
            </SafeButton>
          );
        })}
      </div>

      <div className={styles.listSection}>
        <div className={styles.searchBar}>
          <SearchInputField
            id="calendar-search"
            value={searchInput}
            placeholder={searchPlaceholder}
            onChange={setSearchInput}
            onSubmit={applySearch}
          />
        </div>
        <EmotionNoteListSection
          title={selectedLabel}
          notes={visibleNotes}
          isLoading={isLoading}
          emptyTitle={
            normalizedQuery
              ? "검색 결과가 없습니다."
              : "표시할 기록이 없습니다."
          }
          emptyHint={
            normalizedQuery
              ? "다른 키워드로 다시 검색해보세요."
              : "날짜를 바꿔 다른 기록을 확인해보세요."
          }
          headerRef={listHeaderRef}
          canGoDeeper={access.mode !== "blocked"}
          getDetailHref={getDetailHref}
        />
      </div>
      {isFutureSelected ? null : (
        <FloatingActionButton
          label="기록 추가"
          icon={<Plus size={24} />}
          helperText="기록 추가"
          placement="tab"
          loadingRing={isAddLoading}
          disabled={isAddLoading}
          onClick={async () => {
            if (isAddLoading) {
              return;
            }
            setIsAddLoading(true);
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
            const allowed = await checkUsage();
            if (!allowed) {
              setIsAddLoading(false);
              return;
            }
            if (selectedKey === todayKey) {
              router.push("/session");
              return;
            }
            router.push(`/session?date=${selectedKey}`);
          }}
        />
      )}
    </section>
  );
}
