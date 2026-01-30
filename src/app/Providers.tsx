"use client";

import type { ReactNode } from "react";
import { CbtToastProvider } from "@/components/cbt/common/CbtToast";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return <CbtToastProvider>{children}</CbtToastProvider>;
}
