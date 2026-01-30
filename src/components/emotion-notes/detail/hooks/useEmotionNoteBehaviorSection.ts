"use client";

import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import {
  createBehaviorDetail,
  deleteBehaviorDetail,
  fetchBehaviorDetails,
  updateBehaviorDetail,
} from "../utils/emotionNoteApi";

type UseBehaviorSectionOptions = {
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

export default function useEmotionNoteBehaviorSection({
  noteId,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseBehaviorSectionOptions) {
  const [behaviorLabel, setBehaviorLabel] = useState("");
  const [behaviorDescription, setBehaviorDescription] = useState("");
  const [behaviorErrorTags, setBehaviorErrorTags] = useState<string[]>([]);
  const [details, setDetails] = useState<EmotionNoteBehaviorDetail[]>([]);
  const [editingBehaviorId, setEditingBehaviorId] = useState<number | null>(
    null,
  );
  const [editingBehaviorLabel, setEditingBehaviorLabel] = useState("");
  const [editingBehaviorDescription, setEditingBehaviorDescription] =
    useState("");
  const [editingBehaviorErrorTags, setEditingBehaviorErrorTags] = useState<
    string[]
  >([]);
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

    const { response, data } = await fetchBehaviorDetails(noteId, access);

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
      behavior_label: behaviorLabel.trim(),
      behavior_description: behaviorDescription.trim(),
      error_tags: behaviorErrorTags,
    };

    if (!payload.behavior_label || !payload.behavior_description) {
      setError("행동 반응과 설명을 입력해주세요.");
      return;
    }

    const response = await createBehaviorDetail(payload, access);

    if (!response.ok) {
      setError("행동 반응 저장에 실패했습니다.");
      return;
    }

    setBehaviorLabel("");
    setBehaviorDescription("");
    setBehaviorErrorTags([]);
    await loadDetails();
  }, [
    behaviorDescription,
    behaviorErrorTags,
    behaviorLabel,
    ensureNoteId,
    loadDetails,
    requireAccessContext,
    setError,
  ]);

  const handleAddWithValues = useCallback(
    async (label: string, description: string, errorTags: string[]) => {
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
        behavior_label: label.trim(),
        behavior_description: description.trim(),
        error_tags: errorTags,
      };

      if (!payload.behavior_label || !payload.behavior_description) {
        setError("행동 반응과 설명을 입력해주세요.");
        return false;
      }

      const response = await createBehaviorDetail(payload, access);

      if (!response.ok) {
        setError("행동 반응 저장에 실패했습니다.");
        return false;
      }

      setBehaviorLabel("");
      setBehaviorDescription("");
      setBehaviorErrorTags([]);
      await loadDetails();
      return true;
    },
    [ensureNoteId, loadDetails, requireAccessContext, setError],
  );

  const startEditing = useCallback((detail: EmotionNoteBehaviorDetail) => {
    setEditingBehaviorId(detail.id);
    setEditingBehaviorLabel(detail.behavior_label);
    setEditingBehaviorDescription(detail.behavior_description);
    setEditingBehaviorErrorTags(detail.error_tags ?? []);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingBehaviorId(null);
    setEditingBehaviorLabel("");
    setEditingBehaviorDescription("");
    setEditingBehaviorErrorTags([]);
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
        behavior_label: editingBehaviorLabel.trim(),
        behavior_description: editingBehaviorDescription.trim(),
        error_tags: editingBehaviorErrorTags,
      };

      if (!payload.behavior_label || !payload.behavior_description) {
        setError("행동 반응과 설명을 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      const response = await updateBehaviorDetail(payload, access);

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
      editingBehaviorErrorTags,
      editingBehaviorLabel,
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

      const response = await deleteBehaviorDetail(detailId, access);

      if (!response.ok) {
        setError("행동 반응 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      await loadDetails();
      setDeletingId(null);
    },
    [loadDetails, requireAccessContext, setError],
  );

  return {
    behaviorLabel,
    behaviorDescription,
    behaviorErrorTags,
    details,
    editingBehaviorId,
    editingBehaviorLabel,
    editingBehaviorDescription,
    editingBehaviorErrorTags,
    setBehaviorLabel,
    setBehaviorDescription,
    setBehaviorErrorTags,
    setEditingBehaviorLabel,
    setEditingBehaviorDescription,
    setEditingBehaviorErrorTags,
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
