"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./EmotionCalendarSection.module.css";
import type { EmotionNote } from "@/lib/types";
import { fetchEmotionNotesByRange } from "./utils/emotionCalendarApi";

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

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export default function EmotionCalendarSection() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [notes, setNotes] = useState<EmotionNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(
        currentMonth,
      ),
    [currentMonth],
  );

  const days = useMemo(() => buildCalendar(currentMonth), [currentMonth]);

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) => {
      const key = note.created_at.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [notes]);

  const selectedNotes = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const key = formatDateKey(selectedDate);
    return notes.filter((note) => note.created_at.startsWith(key));
  }, [notes, selectedDate]);

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
          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
              )
            }
            aria-label="이전 달"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
              )
            }
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
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
            <button
              key={key}
              type="button"
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
            </button>
          );
        })}
      </div>

      <div className={styles.detailCard}>
        <div>
          <p className={styles.detailLabel}>
            {selectedDate
              ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
              : "날짜를 선택하세요"}
          </p>
          <p className={styles.detailSubtitle}>
            {isLoading
              ? "불러오는 중..."
              : `${selectedNotes.length}개의 기록`}
          </p>
        </div>
        <div className={styles.detailList}>
          {selectedNotes.length === 0 ? (
            <p className={styles.detailEmpty}>표시할 기록이 없습니다.</p>
          ) : (
            selectedNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={styles.detailItem}
                onClick={() => router.push(`/detail/${note.id}`)}
              >
                <p className={styles.detailTitle}>{note.title}</p>
                <p className={styles.detailText}>{note.trigger_text}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
