"use client";

import { useCallback, useState } from "react";
import type { EmotionNoteAlternativeDetail } from "@/lib/types";
import {
  createAlternativeDetail,
  deleteAlternativeDetail,
  fetchAlternativeDetails,
  updateAlternativeDetail,
} from "../utils/emotionNoteApi";

type UseAlternativeSectionOptions = {
  noteId?: number | null;
  getAccessToken: () => Promise<string | null>;
  requireAccessToken: () => Promise<string | null>;
  ensureNoteId: () => number | null;
  setError: (message: string) => void;
};

export default function useAlternativeSection({
  noteId,
  getAccessToken,
  requireAccessToken,
  ensureNoteId,
  setError,
}: UseAlternativeSectionOptions) {
  const [alternativeText, setAlternativeText] = useState("");
  const [details, setDetails] = useState<EmotionNoteAlternativeDetail[]>([]);
  const [editingAlternativeId, setEditingAlternativeId] =
    useState<number | null>(null);
  const [editingAlternativeText, setEditingAlternativeText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDetails = useCallback(async () => {
    if (!noteId) {
      setDetails([]);
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setDetails([]);
      return;
    }

    const { response, data } = await fetchAlternativeDetails(
      noteId,
      accessToken,
    );

    if (!response.ok) {
      setDetails([]);
      return;
    }
    setDetails(data.details ?? []);
  }, [getAccessToken, noteId]);

  const handleAdd = useCallback(async () => {
    const ensuredNoteId = ensureNoteId();
    if (!ensuredNoteId) {
      return;
    }

    const accessToken = await requireAccessToken();
    if (!accessToken) {
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

    const response = await createAlternativeDetail(payload, accessToken);

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
    requireAccessToken,
    setError,
  ]);

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
      const accessToken = await requireAccessToken();
      if (!accessToken) {
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

      const response = await updateAlternativeDetail(payload, accessToken);

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
      requireAccessToken,
      setError,
    ],
  );

  const handleDelete = useCallback(
    async (detailId: number) => {
      setDeletingId(detailId);
      const accessToken = await requireAccessToken();
      if (!accessToken) {
        setDeletingId(null);
        return;
      }

      const response = await deleteAlternativeDetail(detailId, accessToken);

      if (!response.ok) {
        setError("대안 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessToken, setError],
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
    startEditing,
    cancelEditing,
    handleUpdate,
    handleDelete,
  };
}
