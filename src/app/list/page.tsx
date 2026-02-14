import EmotionNoteListPage from "@/components/list/EmotionNoteListPage";
import { Suspense } from "react";

export default function EmotionNoteListRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteListPage />
    </Suspense>
  );
}
