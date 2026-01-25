"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmotionNote } from "@/lib/types";

export const useGraphSelection = (notes: EmotionNote[]) => {
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

  const selectableNotes = useMemo(
    () => notes.filter((note) => String(note.id) !== selectedNodeId),
    [notes, selectedNodeId],
  );

  const sortedSelectableNotes = useMemo(
    () => [...selectableNotes].sort((a, b) => b.id - a.id),
    [selectableNotes],
  );

  const clearSelection = () => setSelectedNodeId(null);
  const toggleSelection = (nodeId: string) =>
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));

  return {
    selectedNodeId,
    selectedNote,
    selectableNotes,
    sortedSelectableNotes,
    clearSelection,
    toggleSelection,
  };
};
