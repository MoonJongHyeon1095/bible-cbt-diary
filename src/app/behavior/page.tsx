import BehaviorPage from "@/components/behavior/BehaviorPage";
import { Suspense } from "react";

export default function BehaviorRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <BehaviorPage />
    </Suspense>
  );
}
