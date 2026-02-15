import { Suspense } from "react";
import EmotionNoteHomePage from "@/components/home/EmotionNoteHomePage";

export default function EmotionNoteHomeRoutePage() {
  return (
    <Suspense fallback={null}>
      <EmotionNoteHomePage />
    </Suspense>
  );
}
