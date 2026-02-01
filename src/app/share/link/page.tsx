import ShareLinkPage from "@/components/share/ShareLinkPage";
import { Suspense } from "react";

export default function ShareLinkRoutePage() {
  return (
    <Suspense fallback={<div />}>
      <ShareLinkPage />
    </Suspense>
  );
}
