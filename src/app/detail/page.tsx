import EmotionNoteDetailPage from "@/components/emotion-notes/detail/EmotionNoteDetailPage";
import { Suspense } from "react";

export default function DetailCreatePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteDetailPage />
    </Suspense>
  );
}
