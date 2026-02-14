import EmotionNoteCalendarPage from "@/components/month/EmotionNoteCalendarPage";
import { Suspense } from "react";

export default function EmotionNoteCalendarRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteCalendarPage />
    </Suspense>
  );
}
