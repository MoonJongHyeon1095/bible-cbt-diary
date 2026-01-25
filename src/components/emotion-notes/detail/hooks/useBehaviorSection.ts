"use client";

import type { EmotionNoteBehaviorDetail } from "@/lib/types/types";
import { useCallback, useState } from "react";
import {
  createBehaviorDetail,
  deleteBehaviorDetail,
  fetchBehaviorDetails,
  updateBehaviorDetail,
} from "../utils/emotionNoteApi";

type UseBehaviorSectionOptions = {
  noteId?: number | null;
  getAccessToken: () => Promise<string | null>;
  requireAccessToken: () => Promise<string | null>;
  ensureNoteId: () => number | null;
  setError: (message: string) => void;
};

export default function useBehaviorSection({
  noteId,
  getAccessToken,
  requireAccessToken,
  ensureNoteId,
  setError,
}: UseBehaviorSectionOptions) {
  const [behaviorLabel, setBehaviorLabel] = useState("");
  const [behaviorDescription, setBehaviorDescription] = useState("");
  const [details, setDetails] = useState<EmotionNoteBehaviorDetail[]>([]);
  const [editingBehaviorId, setEditingBehaviorId] = useState<number | null>(
    null,
  );
  const [editingBehaviorLabel, setEditingBehaviorLabel] = useState("");
  const [editingBehaviorDescription, setEditingBehaviorDescription] =
    useState("");
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

    const { response, data } = await fetchBehaviorDetails(noteId, accessToken);

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
      behavior_label: behaviorLabel.trim(),
      behavior_description: behaviorDescription.trim(),
    };

    if (!payload.behavior_label || !payload.behavior_description) {
      setError("행동 반응과 설명을 입력해주세요.");
      return;
    }

    const response = await createBehaviorDetail(payload, accessToken);

    if (!response.ok) {
      setError("행동 반응 저장에 실패했습니다.");
      return;
    }

    setBehaviorLabel("");
    setBehaviorDescription("");
    await loadDetails();
  }, [
    behaviorDescription,
    behaviorLabel,
    ensureNoteId,
    loadDetails,
    requireAccessToken,
    setError,
  ]);

  const startEditing = useCallback((detail: EmotionNoteBehaviorDetail) => {
    setEditingBehaviorId(detail.id);
    setEditingBehaviorLabel(detail.behavior_label);
    setEditingBehaviorDescription(detail.behavior_description);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingBehaviorId(null);
    setEditingBehaviorLabel("");
    setEditingBehaviorDescription("");
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
        behavior_label: editingBehaviorLabel.trim(),
        behavior_description: editingBehaviorDescription.trim(),
      };

      if (!payload.behavior_label || !payload.behavior_description) {
        setError("행동 반응과 설명을 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      const response = await updateBehaviorDetail(payload, accessToken);

      if (!response.ok) {
        setError("행동 반응 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      await loadDetails();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingBehaviorDescription,
      editingBehaviorLabel,
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

      const response = await deleteBehaviorDetail(detailId, accessToken);

      if (!response.ok) {
        setError("행동 반응 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessToken, setError],
  );

  return {
    behaviorLabel,
    behaviorDescription,
    details,
    editingBehaviorId,
    editingBehaviorLabel,
    editingBehaviorDescription,
    setBehaviorLabel,
    setBehaviorDescription,
    setEditingBehaviorLabel,
    setEditingBehaviorDescription,
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
