"use client";

import type { EmotionNoteErrorDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import { fetchErrorDetails } from "@/lib/api/emotion-error-details/getEmotionErrorDetails";
import { createErrorDetail } from "@/lib/api/emotion-error-details/postEmotionErrorDetails";
import { updateErrorDetail } from "@/lib/api/emotion-error-details/patchEmotionErrorDetails";
import { deleteErrorDetail } from "@/lib/api/emotion-error-details/deleteEmotionErrorDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";

type UseErrorSectionOptions = {
  noteId?: number | null;
  access: AccessContext;
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

export default function useEmotionNoteErrorSection({
  noteId,
  access,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseErrorSectionOptions) {
  const [errorLabel, setErrorLabel] = useState("");
  const [errorDescription, setErrorDescription] = useState("");
  const [editingErrorId, setEditingErrorId] = useState<number | null>(null);
  const [editingErrorLabel, setEditingErrorLabel] = useState("");
  const [editingErrorDescription, setEditingErrorDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: noteId ? queryKeys.errorDetails(access, noteId) : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return [];
      }
      const resolved = await getAccessContext();
      if (resolved.mode === "blocked") {
        return [];
      }
      const { response, data } = await fetchErrorDetails(noteId, resolved);
      if (!response.ok) {
        throw new Error("emotion_error_details fetch failed");
      }
      return data.details ?? [];
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  const details = detailsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: {
      note_id: number;
      error_label: string;
      error_description: string;
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await createErrorDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("create error detail failed");
      }
      return payload.note_id;
    },
    onSuccess: (targetNoteId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.errorDetails(access, targetNoteId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: number;
      error_label: string;
      error_description: string;
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await updateErrorDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("update error detail failed");
      }
      return payload.id;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.errorDetails(access, noteId),
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (detailId: number) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await deleteErrorDetail(detailId, resolved);
      if (!response.ok) {
        throw new Error("delete error detail failed");
      }
      return detailId;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.errorDetails(access, noteId),
        });
      }
    },
  });

  const handleAdd = useCallback(async () => {
    const ensuredNoteId = ensureNoteId();
    if (!ensuredNoteId) {
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

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      setError("인지 오류 저장에 실패했습니다.");
      return;
    }

    setErrorLabel("");
    setErrorDescription("");
  }, [createMutation, ensureNoteId, errorDescription, errorLabel, setError]);

  const handleAddWithValues = useCallback(
    async (label: string, description: string) => {
      const ensuredNoteId = ensureNoteId();
      if (!ensuredNoteId) {
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

      try {
        await createMutation.mutateAsync(payload);
      } catch {
        setError("인지 오류 저장에 실패했습니다.");
        return false;
      }

      setErrorLabel("");
      setErrorDescription("");
      return true;
    },
    [createMutation, ensureNoteId, setError],
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

      try {
        await updateMutation.mutateAsync(payload);
      } catch {
        setError("인지 오류 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingErrorDescription,
      editingErrorLabel,
      setError,
      updateMutation,
    ],
  );

  const handleDelete = useCallback(
    async (detailId: number) => {
      setDeletingId(detailId);
      try {
        await deleteMutation.mutateAsync(detailId);
      } catch {
        setError("인지 오류 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
    },
    [deleteMutation, setError],
  );

  return {
    details,
    errorLabel,
    errorDescription,
    editingErrorId,
    editingErrorLabel,
    editingErrorDescription,
    setErrorLabel,
    setErrorDescription,
    setEditingErrorLabel,
    setEditingErrorDescription,
    isUpdating,
    deletingId,
    handleAdd,
    handleAddWithValues,
    startEditing,
    cancelEditing,
    handleUpdate,
    handleDelete,
  };
}
