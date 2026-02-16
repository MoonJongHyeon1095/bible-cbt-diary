import BehaviorSuggestionPage from "@/components/behavior/BehaviorSuggestionPage";
import { Suspense } from "react";

export default function BehaviorSuggestionRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <BehaviorSuggestionPage />
    </Suspense>
  );
}
