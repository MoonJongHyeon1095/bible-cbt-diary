"use client";

import type { EmotionNoteDetail } from "@/lib/types/types";
import { useCallback, useState } from "react";
import {
  createThoughtDetail,
  deleteThoughtDetail,
  fetchThoughtDetails,
  updateThoughtDetail,
} from "../utils/emotionNoteApi";

type UseThoughtSectionOptions = {
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

export default function useThoughtSection({
  noteId,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseThoughtSectionOptions) {
  const [detailThought, setDetailThought] = useState("");
  const [detailEmotion, setDetailEmotion] = useState("");
  const [details, setDetails] = useState<EmotionNoteDetail[]>([]);
  const [editingThoughtId, setEditingThoughtId] = useState<number | null>(null);
  const [editingThoughtText, setEditingThoughtText] = useState("");
  const [editingEmotionText, setEditingEmotionText] = useState("");
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

    const { response, data } = await fetchThoughtDetails(noteId, access);

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
      automatic_thought: detailThought.trim(),
      emotion: detailEmotion.trim(),
    };

    if (!payload.automatic_thought || !payload.emotion) {
      setError("자동 사고와 감정을 입력해주세요.");
      return;
    }

    const response = await createThoughtDetail(payload, access);

    if (!response.ok) {
      setError("자동 사고 저장에 실패했습니다.");
      return;
    }

    setDetailThought("");
    setDetailEmotion("");
    await loadDetails();
  }, [
    detailEmotion,
    detailThought,
    ensureNoteId,
    loadDetails,
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

      const response = await createThoughtDetail(payload, access);

      if (!response.ok) {
        setError("자동 사고 저장에 실패했습니다.");
        return false;
      }

      setDetailThought("");
      setDetailEmotion("");
      await loadDetails();
      return true;
    },
    [
      ensureNoteId,
      loadDetails,
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

      const response = await updateThoughtDetail(payload, access);

      if (!response.ok) {
        setError("자동 사고 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      await loadDetails();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingEmotionText,
      editingThoughtText,
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

      const response = await deleteThoughtDetail(detailId, access);

      if (!response.ok) {
        setError("자동 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessContext, setError],
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
