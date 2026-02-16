import BehaviorTrackPage from "@/components/behavior/BehaviorTrackPage";
import { Suspense } from "react";

export default function BehaviorTrackRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <BehaviorTrackPage />
    </Suspense>
  );
}
