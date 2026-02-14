"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const parseNumericParam = (value: string | null) => {
  const parsed = Number(value);
  if (!value || Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

export const useFlowSearchParams = () => {
  const searchParams = useSearchParams();

  const flowId = useMemo(
    () => parseNumericParam(searchParams.get("flowId")),
    [searchParams],
  );

  const noteId = useMemo(
    () => parseNumericParam(searchParams.get("noteId")),
    [searchParams],
  );

  return { flowId, noteId };
};
