"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useCallback, useEffect, useMemo, useState } from "react";

export const useFlowDetailSelection = (notes: EmotionNote[]) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (
      selectedNodeId &&
      !notes.some((note) => String(note.id) === selectedNodeId)
    ) {
      setSelectedNodeId(null);
    }
  }, [notes, selectedNodeId]);

  const selectedNote = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    return notes.find((note) => String(note.id) === selectedNodeId) ?? null;
  }, [notes, selectedNodeId]);

  const clearSelection = useCallback(() => setSelectedNodeId(null), []);
  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  return {
    selectedNodeId,
    selectedNote,
    clearSelection,
    selectNode,
  };
};
