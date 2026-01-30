"use client";

import type { EmotionNoteAlternativeDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import {
  createAlternativeDetail,
  deleteAlternativeDetail,
  fetchAlternativeDetails,
  updateAlternativeDetail,
} from "../utils/emotionNoteApi";

type UseAlternativeSectionOptions = {
  noteId?: number | null;
  getAccessContext: () => Promise<{
    mode: "auth" | "guest" | "blocked";
    accessToken: string | null;
  }>;
  requireAccessContext: () => Promise<{
    mode: "auth" | "guest" | "blocked";
    accessToken: string | null;
  } | null>;
  ensureNoteId: () => number | null;
  setError: (message: string) => void;
};

export default function useEmotionNoteAlternativeSection({
  noteId,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseAlternativeSectionOptions) {
  const [alternativeText, setAlternativeText] = useState("");
  const [details, setDetails] = useState<EmotionNoteAlternativeDetail[]>([]);
  const [editingAlternativeId, setEditingAlternativeId] = useState<
    number | null
  >(null);
  const [editingAlternativeText, setEditingAlternativeText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDetails = useCallback(async () => {
    if (!noteId) {
      setDetails([]);
      return;
    }

    const access = await getAccessContext();
    if (access.mode === "blocked") {
      setDetails([]);
      return;
    }

    const { response, data } = await fetchAlternativeDetails(noteId, access);

    if (!response.ok) {
      setDetails([]);
      return;
    }
    setDetails(data.details ?? []);
  }, [getAccessContext, noteId]);

  const handleAdd = useCallback(async () => {
    const ensuredNoteId = ensureNoteId();
    if (!ensuredNoteId) {
      return;
    }

    const access = await requireAccessContext();
    if (!access) {
      return;
    }

    const payload = {
      note_id: ensuredNoteId,
      alternative: alternativeText.trim(),
    };

    if (!payload.alternative) {
      setError("대안 사고를 입력해주세요.");
      return;
    }

    const response = await createAlternativeDetail(payload, access);

    if (!response.ok) {
      setError("대안 사고 저장에 실패했습니다.");
      return;
    }

    setAlternativeText("");
    await loadDetails();
  }, [
    alternativeText,
    ensureNoteId,
    loadDetails,
    requireAccessContext,
    setError,
  ]);

  const handleAddWithValues = useCallback(
    async (alternative: string) => {
      const ensuredNoteId = ensureNoteId();
      if (!ensuredNoteId) {
        return false;
      }

      const access = await requireAccessContext();
      if (!access) {
        return false;
      }

      const payload = {
        note_id: ensuredNoteId,
        alternative: alternative.trim(),
      };

      if (!payload.alternative) {
        setError("대안 사고를 입력해주세요.");
        return false;
      }

      const response = await createAlternativeDetail(payload, access);

      if (!response.ok) {
        setError("대안 사고 저장에 실패했습니다.");
        return false;
      }

      setAlternativeText("");
      await loadDetails();
      return true;
    },
    [ensureNoteId, loadDetails, requireAccessContext, setError],
  );

  const startEditing = useCallback((detail: EmotionNoteAlternativeDetail) => {
    setEditingAlternativeId(detail.id);
    setEditingAlternativeText(detail.alternative);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingAlternativeId(null);
    setEditingAlternativeText("");
  }, []);

  const handleUpdate = useCallback(
    async (detailId: number) => {
      setIsUpdating(true);
      const access = await requireAccessContext();
      if (!access) {
        setIsUpdating(false);
        return;
      }

      const payload = {
        id: detailId,
        alternative: editingAlternativeText.trim(),
      };

      if (!payload.alternative) {
        setError("대안 사고를 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      const response = await updateAlternativeDetail(payload, access);

      if (!response.ok) {
        setError("대안 사고 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      await loadDetails();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingAlternativeText,
      loadDetails,
      requireAccessContext,
      setError,
    ],
  );

  const handleDelete = useCallback(
    async (detailId: number) => {
      setDeletingId(detailId);
      const access = await requireAccessContext();
      if (!access) {
        setDeletingId(null);
        return;
      }

      const response = await deleteAlternativeDetail(detailId, access);

      if (!response.ok) {
        setError("대안 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessContext, setError],
  );

  return {
    alternativeText,
    details,
    editingAlternativeId,
    editingAlternativeText,
    setAlternativeText,
    setEditingAlternativeText,
    setDetails,
    isUpdating,
    deletingId,
    loadDetails,
    handleAdd,
    handleAddWithValues,
    startEditing,
    cancelEditing,
    handleUpdate,
    handleDelete,
  };
}
