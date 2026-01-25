"use client";

import { useEffect, useState } from "react";

export const useGraphDeepSelection = (selectedNodeId: string | null) => {
  const [isDeepSelecting, setIsDeepSelecting] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedNodeId) {
      setIsDeepSelecting(false);
      setSelectedSubIds([]);
    }
  }, [selectedNodeId]);

  const closeDeepSelection = () => {
    setIsDeepSelecting(false);
    setSelectedSubIds([]);
  };

  const toggleSub = (id: string) => {
    setSelectedSubIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  return {
    isDeepSelecting,
    setIsDeepSelecting,
    selectedSubIds,
    toggleSub,
    closeDeepSelection,
    canConfirmDeep: selectedSubIds.length >= 1,
  };
};
