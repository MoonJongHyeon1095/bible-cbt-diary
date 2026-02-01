import ShareCreatePage from "@/components/share/ShareCreatePage";
import { Suspense } from "react";

export default function ShareCreateRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <ShareCreatePage />
    </Suspense>
  );
}
