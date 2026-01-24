"use client";

import { useCallback, useState } from "react";
import type { EmotionNoteErrorDetail } from "@/lib/types";
import {
  createErrorDetail,
  deleteErrorDetail,
  fetchErrorDetails,
  updateErrorDetail,
} from "../utils/emotionNoteApi";

type UseErrorSectionOptions = {
  noteId?: number | null;
  getAccessToken: () => Promise<string | null>;
  requireAccessToken: () => Promise<string | null>;
  ensureNoteId: () => number | null;
  setError: (message: string) => void;
};

export default function useErrorSection({
  noteId,
  getAccessToken,
  requireAccessToken,
  ensureNoteId,
  setError,
}: UseErrorSectionOptions) {
  const [errorLabel, setErrorLabel] = useState("");
  const [errorDescription, setErrorDescription] = useState("");
  const [details, setDetails] = useState<EmotionNoteErrorDetail[]>([]);
  const [editingErrorId, setEditingErrorId] = useState<number | null>(null);
  const [editingErrorLabel, setEditingErrorLabel] = useState("");
  const [editingErrorDescription, setEditingErrorDescription] = useState("");
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

    const { response, data } = await fetchErrorDetails(noteId, accessToken);

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
      error_label: errorLabel.trim(),
      error_description: errorDescription.trim(),
    };

    if (!payload.error_label || !payload.error_description) {
      setError("인지 오류와 설명을 입력해주세요.");
      return;
    }

    const response = await createErrorDetail(payload, accessToken);

    if (!response.ok) {
      setError("인지 오류 저장에 실패했습니다.");
      return;
    }

    setErrorLabel("");
    setErrorDescription("");
    await loadDetails();
  }, [
    ensureNoteId,
    errorDescription,
    errorLabel,
    loadDetails,
    requireAccessToken,
    setError,
  ]);

  const startEditing = useCallback((detail: EmotionNoteErrorDetail) => {
    setEditingErrorId(detail.id);
    setEditingErrorLabel(detail.error_label);
    setEditingErrorDescription(detail.error_description);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingErrorId(null);
    setEditingErrorLabel("");
    setEditingErrorDescription("");
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
        error_label: editingErrorLabel.trim(),
        error_description: editingErrorDescription.trim(),
      };

      if (!payload.error_label || !payload.error_description) {
        setError("인지 오류와 설명을 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      const response = await updateErrorDetail(payload, accessToken);

      if (!response.ok) {
        setError("인지 오류 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      await loadDetails();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingErrorDescription,
      editingErrorLabel,
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

      const response = await deleteErrorDetail(detailId, accessToken);

      if (!response.ok) {
        setError("인지 오류 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessToken, setError],
  );

  return {
    errorLabel,
    errorDescription,
    details,
    editingErrorId,
    editingErrorLabel,
    editingErrorDescription,
    setErrorLabel,
    setErrorDescription,
    setEditingErrorLabel,
    setEditingErrorDescription,
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
