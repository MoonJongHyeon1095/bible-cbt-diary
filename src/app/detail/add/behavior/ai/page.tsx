import { Suspense } from "react";
import EmotionNoteAddBehaviorAiRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddBehaviorAiRouteClient";

export default function EmotionNoteBehaviorAddAiPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddBehaviorAiRouteClient />
    </Suspense>
  );
}
