"use client";

import { useCallback, useState } from "react";
import type { EmotionNoteDetail } from "@/lib/types";
import {
  createThoughtDetail,
  deleteThoughtDetail,
  fetchThoughtDetails,
  updateThoughtDetail,
} from "../utils/emotionNoteApi";

type UseThoughtSectionOptions = {
  noteId?: number | null;
  getAccessToken: () => Promise<string | null>;
  requireAccessToken: () => Promise<string | null>;
  ensureNoteId: () => number | null;
  setError: (message: string) => void;
};

export default function useThoughtSection({
  noteId,
  getAccessToken,
  requireAccessToken,
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

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setDetails([]);
      return;
    }

    const { response, data } = await fetchThoughtDetails(noteId, accessToken);

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
      automatic_thought: detailThought.trim(),
      emotion: detailEmotion.trim(),
    };

    if (!payload.automatic_thought || !payload.emotion) {
      setError("자동 사고와 감정을 입력해주세요.");
      return;
    }

    const response = await createThoughtDetail(payload, accessToken);

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
    requireAccessToken,
    setError,
  ]);

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
      const accessToken = await requireAccessToken();
      if (!accessToken) {
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

      const response = await updateThoughtDetail(payload, accessToken);

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

      const response = await deleteThoughtDetail(detailId, accessToken);

      if (!response.ok) {
        setError("자동 사고 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessToken, setError],
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
    startEditing,
    cancelEditing,
    handleUpdate,
    handleDelete,
  };
}
