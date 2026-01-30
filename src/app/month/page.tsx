import EmotionNoteCalendarPage from "@/components/calendar/EmotionNoteCalendarPage";
import { Suspense } from "react";

export default function EmotionNoteCalendarRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteCalendarPage />
    </Suspense>
  );
}
