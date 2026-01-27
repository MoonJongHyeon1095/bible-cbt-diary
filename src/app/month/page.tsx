import { Suspense } from "react";
import MonthClientPage from "./MonthClientPage";

export default function EmotionCalendarPage() {
  return (
    <Suspense fallback={<div />}>
      <MonthClientPage />
    </Suspense>
  );
}
