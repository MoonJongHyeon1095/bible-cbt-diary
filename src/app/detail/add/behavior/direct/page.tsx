import { Suspense } from "react";
import EmotionNoteAddBehaviorDirectRouteClient from "@/components/emotion-notes/detail/add/routes/EmotionNoteAddBehaviorDirectRouteClient";

export default function EmotionNoteBehaviorAddDirectPage() {
  return (
    <Suspense fallback={<div />}>
      <EmotionNoteAddBehaviorDirectRouteClient />
    </Suspense>
  );
}
