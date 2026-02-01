import SharePublicPage from "@/components/share/SharePublicPage";
import { Suspense } from "react";

export default function ShareRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <SharePublicPage />
    </Suspense>
  );
}
