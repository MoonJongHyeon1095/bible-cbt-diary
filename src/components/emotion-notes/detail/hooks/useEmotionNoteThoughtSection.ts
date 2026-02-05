"use client";

import type { EmotionNoteDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import { fetchThoughtDetails } from "@/lib/api/emotion-note-details/getEmotionNoteDetails";
import { createThoughtDetail } from "@/lib/api/emotion-note-details/postEmotionNoteDetails";
import { updateThoughtDetail } from "@/lib/api/emotion-note-details/patchEmotionNoteDetails";
import { deleteThoughtDetail } from "@/lib/api/emotion-note-details/deleteEmotionNoteDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";

type UseThoughtSectionOptions = {
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

export default function useEmotionNoteThoughtSection({
  noteId,
  access,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseThoughtSectionOptions) {
  const [detailThought, setDetailThought] = useState("");
  const [detailEmotion, setDetailEmotion] = useState("");
  const [editingThoughtId, setEditingThoughtId] = useState<number | null>(null);
  const [editingThoughtText, setEditingThoughtText] = useState("");
  const [editingEmotionText, setEditingEmotionText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: noteId ? queryKeys.thoughtDetails(access, noteId) : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return [];
      }
      const resolved = await getAccessContext();
      if (resolved.mode === "blocked") {
        return [];
      }
      const { response, data } = await fetchThoughtDetails(noteId, resolved);
      if (!response.ok) {
        throw new Error("emotion_note_details fetch failed");
      }
      return data.details ?? [];
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  const details = detailsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: {
      note_id: number;
      automatic_thought: string;
      emotion: string;
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await createThoughtDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("create thought detail failed");
      }
      return payload.note_id;
    },
    onSuccess: (targetNoteId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.thoughtDetails(access, targetNoteId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: number;
      automatic_thought: string;
      emotion: string;
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await updateThoughtDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("update thought detail failed");
      }
      return payload.id;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.thoughtDetails(access, noteId),
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
      const response = await deleteThoughtDetail(detailId, resolved);
      if (!response.ok) {
        throw new Error("delete thought detail failed");
      }
      return detailId;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.thoughtDetails(access, noteId),
        });
      }
    },
  });

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
      automatic_thought: detailThought.trim(),
      emotion: detailEmotion.trim(),
    };

    if (!payload.automatic_thought || !payload.emotion) {
      setError("자동 사고와 감정을 입력해주세요.");
      return;
    }

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      setError("자동 사고 저장에 실패했습니다.");
      return;
    }

    setDetailThought("");
    setDetailEmotion("");
  }, [
    detailEmotion,
    detailThought,
    createMutation,
    ensureNoteId,
    requireAccessContext,
    setError,
  ]);

  const handleAddWithValues = useCallback(
    async (automaticThought: string, emotion: string) => {
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
        automatic_thought: automaticThought.trim(),
        emotion: emotion.trim(),
      };

      if (!payload.automatic_thought || !payload.emotion) {
        setError("자동 사고와 감정을 입력해주세요.");
        return false;
      }

      try {
        await createMutation.mutateAsync(payload);
      } catch {
        setError("자동 사고 저장에 실패했습니다.");
        return false;
      }

      setDetailThought("");
      setDetailEmotion("");
      return true;
    },
    [
      createMutation,
      ensureNoteId,
      requireAccessContext,
      setError,
      setDetailEmotion,
      setDetailThought,
    ],
  );

  const startEditing = useCallback((detail: EmotionNoteDetail) => {
    setEditingThoughtId(detail.id);
    setEditingThoughtText(detail.automatic_thought);
    setEditingEmotionText(detail.emotion);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingThoughtId(null);
    setEditingThoughtText("");
    setEditingEmotionText("");
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
        automatic_thought: editingThoughtText.trim(),
        emotion: editingEmotionText.trim(),
      };

      if (!payload.automatic_thought || !payload.emotion) {
        setError("자동 사고와 감정을 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      try {
        await updateMutation.mutateAsync(payload);
      } catch {
        setError("자동 사고 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingEmotionText,
      editingThoughtText,
      requireAccessContext,
      setError,
      updateMutation,
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

      try {
        await deleteMutation.mutateAsync(detailId);
      } catch {
        setError("자동 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
    },
    [deleteMutation, requireAccessContext, setError],
  );

  return {
    detailThought,
    detailEmotion,
    details,
    editingThoughtId,
    editingThoughtText,
    editingEmotionText,
    setDetailThought,
    setDetailEmotion,
    setEditingThoughtText,
    setEditingEmotionText,
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
