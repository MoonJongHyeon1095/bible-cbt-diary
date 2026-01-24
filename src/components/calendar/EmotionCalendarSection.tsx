"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatKoreanDateKey, formatKoreanDateTime } from "@/lib/time";
import styles from "./EmotionCalendarSection.module.css";
import type { EmotionNote } from "@/lib/types";
import { fetchEmotionNotesByRange } from "./utils/emotionCalendarApi";
import EmotionNoteListSection from "@/components/emotion-notes/EmotionNoteListSection";
import Button from "@/components/ui/Button";

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

export default function EmotionCalendarSection() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const monthLabel = useMemo(
    () =>
      formatKoreanDateTime(currentMonth, {
        year: "numeric",
        month: "long",
      }),
    [currentMonth],
  );

  const days = useMemo(() => buildCalendar(currentMonth), [currentMonth]);

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) => {
      const key = formatKoreanDateKey(note.created_at);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [notes]);

  const selectedNotes = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const key = formatDateKey(selectedDate);
    return notes.filter((note) => formatKoreanDateKey(note.created_at) === key);
  }, [notes, selectedDate]);

  const selectedLabel = useMemo(() => {
    if (!selectedDate) {
      return "날짜를 선택하세요";
    }
    const dateLabel = formatKoreanDateTime(selectedDate, {
      month: "long",
      day: "numeric",
    });
    return `${dateLabel} ${selectedNotes.length}개의 기록이 있습니다`;
  }, [selectedDate, selectedNotes.length]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setNotes([]);
        setIsLoading(false);
        return;
      }
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      const { response, data } = await fetchEmotionNotesByRange(
        start,
        end,
        accessToken,
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
  }, [currentMonth, supabase]);

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
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
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
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
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
                day.inMonth ? styles.cellInMonth : styles.cellOut,
                isToday ? styles.cellToday : "",
                isSelected ? styles.cellSelected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDate(day.date)}
            >
              <span className={styles.dayNumber}>{day.date.getDate()}</span>
              {count > 0 ? (
                <span className={styles.countBadge}>{count}</span>
              ) : (
                <span className={styles.emptyDot} />
              )}
            </Button>
          );
        })}
      </div>

      <div className={styles.listSection}>
        <EmotionNoteListSection
          title={selectedLabel}
          notes={selectedNotes}
          isLoading={isLoading}
          emptyTitle="표시할 기록이 없습니다."
          emptyHint="날짜를 바꿔 다른 기록을 확인해보세요."
        />
      </div>
    </section>
  );
}
