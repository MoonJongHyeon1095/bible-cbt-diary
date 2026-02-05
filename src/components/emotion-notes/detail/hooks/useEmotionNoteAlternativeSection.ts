"use client";

import type { EmotionNoteAlternativeDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import { fetchAlternativeDetails } from "@/lib/api/emotion-alternative-details/getEmotionAlternativeDetails";
import { createAlternativeDetail } from "@/lib/api/emotion-alternative-details/postEmotionAlternativeDetails";
import { updateAlternativeDetail } from "@/lib/api/emotion-alternative-details/patchEmotionAlternativeDetails";
import { deleteAlternativeDetail } from "@/lib/api/emotion-alternative-details/deleteEmotionAlternativeDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";

type UseAlternativeSectionOptions = {
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

export default function useEmotionNoteAlternativeSection({
  noteId,
  access,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseAlternativeSectionOptions) {
  const [alternativeText, setAlternativeText] = useState("");
  const [editingAlternativeId, setEditingAlternativeId] = useState<
    number | null
  >(null);
  const [editingAlternativeText, setEditingAlternativeText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: noteId ? queryKeys.alternativeDetails(access, noteId) : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return [];
      }
      const resolved = await getAccessContext();
      if (resolved.mode === "blocked") {
        return [];
      }
      const { response, data } = await fetchAlternativeDetails(noteId, resolved);
      if (!response.ok) {
        throw new Error("emotion_alternative_details fetch failed");
      }
      return data.details ?? [];
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  const details = detailsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: { note_id: number; alternative: string }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await createAlternativeDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("create alternative detail failed");
      }
      return payload.note_id;
    },
    onSuccess: (targetNoteId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.alternativeDetails(access, targetNoteId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; alternative: string }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await updateAlternativeDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("update alternative detail failed");
      }
      return payload.id;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.alternativeDetails(access, noteId),
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
      const response = await deleteAlternativeDetail(detailId, resolved);
      if (!response.ok) {
        throw new Error("delete alternative detail failed");
      }
      return detailId;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.alternativeDetails(access, noteId),
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
      alternative: alternativeText.trim(),
    };

    if (!payload.alternative) {
      setError("대안 사고를 입력해주세요.");
      return;
    }

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      setError("대안 사고 저장에 실패했습니다.");
      return;
    }

    setAlternativeText("");
  }, [alternativeText, createMutation, ensureNoteId, setError]);

  const handleAddWithValues = useCallback(
    async (alternative: string) => {
      const ensuredNoteId = ensureNoteId();
      if (!ensuredNoteId) {
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

      try {
        await createMutation.mutateAsync(payload);
      } catch {
        setError("대안 사고 저장에 실패했습니다.");
        return false;
      }

      setAlternativeText("");
      return true;
    },
    [createMutation, ensureNoteId, setError],
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

      const payload = {
        id: detailId,
        alternative: editingAlternativeText.trim(),
      };

      if (!payload.alternative) {
        setError("대안 사고를 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      try {
        await updateMutation.mutateAsync(payload);
      } catch {
        setError("대안 사고 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      setIsUpdating(false);
    },
    [cancelEditing, editingAlternativeText, setError, updateMutation],
  );

  const handleDelete = useCallback(
    async (detailId: number) => {
      setDeletingId(detailId);
      try {
        await deleteMutation.mutateAsync(detailId);
      } catch {
        setError("대안 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
    },
    [deleteMutation, setError],
  );

  return {
    alternativeText,
    details,
    editingAlternativeId,
    editingAlternativeText,
    setAlternativeText,
    setEditingAlternativeText,
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
