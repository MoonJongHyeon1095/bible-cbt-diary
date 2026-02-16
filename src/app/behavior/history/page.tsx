import BehaviorDateHistoryPage from "@/components/behavior/BehaviorDateHistoryPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <BehaviorDateHistoryPage />
    </Suspense>
  );
}
