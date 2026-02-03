"use client";

import FloatingActionButton from "@/components/common/FloatingActionButton";
import EmotionNoteListSection from "@/components/emotion-notes/EmotionNoteListSection";
import Button from "@/components/ui/Button";
import { useAiUsageGuard } from "@/lib/hooks/useAiUsageGuard";
import type { AccessContext } from "@/lib/types/access";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/utils/time";
import {
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EmotionNoteCalendarSection.module.css";
import { fetchEmotionNotesByRange } from "./utils/emotionNoteCalendarApi";

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

type EmotionNoteCalendarSectionProps = {
  access: AccessContext;
  initialSelectedDate?: Date | null;
};

export default function EmotionNoteCalendarSection({
  access,
  initialSelectedDate = null,
}: EmotionNoteCalendarSectionProps) {
  const initialMonth = initialSelectedDate ?? new Date();
  const [currentMonth, setCurrentMonth] = useState(() => initialMonth);
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () => initialSelectedDate,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const listHeaderRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { checkUsage } = useAiUsageGuard({ enabled: false, cache: true });

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
    const load = async () => {
      setIsLoading(true);
      const start = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const end = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      );
      const { response, data } = await fetchEmotionNotesByRange(
        start,
        end,
        access,
      );
      if (!response.ok) {
        setNotes([]);
        setIsLoading(false);
        return;
      }
      setNotes(data.notes ?? []);
      setIsLoading(false);
    };

    load();
  }, [access, currentMonth]);

  const visibleNotes = normalizedQuery ? searchResults : selectedNotes;
  const getDetailHref = useMemo(
    () => (note: EmotionNote) => {
      const dateKey = selectedDate
        ? formatKoreanDateKey(selectedDate)
        : formatKoreanDateKey(note.created_at);
      return `/detail?id=${note.id}&from=month&date=${dateKey}`;
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
  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;
  const isPastDate =
    selectedKey !== null && selectedKey < todayKey && !normalizedQuery;
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
          <p className={styles.label}>월별 기록</p>
          <h2 className={styles.title}>{monthLabel}</h2>
        </div>
        <div className={styles.controls}>
          <Button
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
          </Button>
          <Button
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
          </Button>
        </div>
      </header>

      <div className={styles.weekRow}>
        {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day) => {
          const key = formatDateKey(day.date);
          const count = countsByDate.get(key) ?? 0;
          const isToday = key === formatDateKey(new Date());
          const isSelected =
            selectedDate && key === formatDateKey(selectedDate);
          return (
            <Button
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
            </Button>
          );
        })}
      </div>

      <div className={styles.listSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchField}>
            <Search size={16} aria-hidden className={styles.searchIcon} />
            <input
              id="calendar-search"
              type="search"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              className={styles.searchInput}
            />
            <Button
              type="button"
              variant="unstyled"
              className={styles.searchSubmit}
              onClick={applySearch}
              aria-label="검색"
            >
              <CornerDownLeft size={16} />
            </Button>
          </div>
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
          canGoDeeper={access.mode === "auth"}
          getDetailHref={getDetailHref}
        />
      </div>
      {isPastDate ? (
        <FloatingActionButton
          label="이 날의 기록 추가"
          icon={<Plus size={24} />}
          helperText="이 날의 기록 추가"
          loadingRing={isAddLoading}
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
            if (!selectedDate) {
              router.push("/session");
              return;
            }
            const dateKey = formatKoreanDateKey(selectedDate);
            router.push(`/session?date=${dateKey}`);
          }}
          className={styles.calendarFab}
        />
      ) : null}
    </section>
  );
}
