import EmotionNoteSearchPage from "@/components/search/EmotionNoteSearchPage";
import { Suspense } from "react";

export default function EmotionNoteSearchRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteSearchPage />
    </Suspense>
  );
}
