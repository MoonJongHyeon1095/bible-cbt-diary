"use client";

import type { EmotionNoteErrorDetail } from "@/lib/types/types";
import { useCallback, useState } from "react";
import {
  createErrorDetail,
  deleteErrorDetail,
  fetchErrorDetails,
  updateErrorDetail,
} from "../utils/emotionNoteApi";

type UseErrorSectionOptions = {
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

export default function useErrorSection({
  noteId,
  getAccessContext,
  requireAccessContext,
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

    const access = await getAccessContext();
    if (access.mode === "blocked") {
      setDetails([]);
      return;
    }

    const { response, data } = await fetchErrorDetails(noteId, access);

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
      error_label: errorLabel.trim(),
      error_description: errorDescription.trim(),
    };

    if (!payload.error_label || !payload.error_description) {
      setError("인지 오류와 설명을 입력해주세요.");
      return;
    }

    const response = await createErrorDetail(payload, access);

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
    requireAccessContext,
    setError,
  ]);

  const handleAddWithValues = useCallback(
    async (label: string, description: string) => {
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
        error_label: label.trim(),
        error_description: description.trim(),
      };

      if (!payload.error_label || !payload.error_description) {
        setError("인지 오류와 설명을 입력해주세요.");
        return false;
      }

      const response = await createErrorDetail(payload, access);

      if (!response.ok) {
        setError("인지 오류 저장에 실패했습니다.");
        return false;
      }

      setErrorLabel("");
      setErrorDescription("");
      await loadDetails();
      return true;
    },
    [
      ensureNoteId,
      loadDetails,
      requireAccessContext,
      setError,
      setErrorDescription,
      setErrorLabel,
    ],
  );

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
      const access = await requireAccessContext();
      if (!access) {
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

      const response = await updateErrorDetail(payload, access);

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

      const response = await deleteErrorDetail(detailId, access);

      if (!response.ok) {
        setError("인지 오류 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessContext, setError],
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
    handleAddWithValues,
    startEditing,
    cancelEditing,
    handleUpdate,
    handleDelete,
  };
}
