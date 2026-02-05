"use client";

import type { EmotionNoteBehaviorDetail } from "@/lib/types/emotionNoteTypes";
import { useCallback, useState } from "react";
import { fetchBehaviorDetails } from "@/lib/api/emotion-behavior-details/getEmotionBehaviorDetails";
import { createBehaviorDetail } from "@/lib/api/emotion-behavior-details/postEmotionBehaviorDetails";
import { updateBehaviorDetail } from "@/lib/api/emotion-behavior-details/patchEmotionBehaviorDetails";
import { deleteBehaviorDetail } from "@/lib/api/emotion-behavior-details/deleteEmotionBehaviorDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";

type UseBehaviorSectionOptions = {
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

export default function useEmotionNoteBehaviorSection({
  noteId,
  access,
  getAccessContext,
  requireAccessContext,
  ensureNoteId,
  setError,
}: UseBehaviorSectionOptions) {
  const [behaviorLabel, setBehaviorLabel] = useState("");
  const [behaviorDescription, setBehaviorDescription] = useState("");
  const [behaviorErrorTags, setBehaviorErrorTags] = useState<string[]>([]);
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
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: noteId ? queryKeys.behaviorDetails(access, noteId) : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return [];
      }
      const resolved = await getAccessContext();
      if (resolved.mode === "blocked") {
        return [];
      }
      const { response, data } = await fetchBehaviorDetails(noteId, resolved);
      if (!response.ok) {
        throw new Error("emotion_behavior_details fetch failed");
      }
      return data.details ?? [];
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  const details = detailsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: {
      note_id: number;
      behavior_label: string;
      behavior_description: string;
      behavior_error_tags: string[];
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await createBehaviorDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("create behavior detail failed");
      }
      return payload.note_id;
    },
    onSuccess: (targetNoteId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.behaviorDetails(access, targetNoteId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: number;
      behavior_label: string;
      behavior_description: string;
      behavior_error_tags: string[];
    }) => {
      const resolved = await requireAccessContext();
      if (!resolved) {
        throw new Error("access blocked");
      }
      const response = await updateBehaviorDetail(payload, resolved);
      if (!response.ok) {
        throw new Error("update behavior detail failed");
      }
      return payload.id;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.behaviorDetails(access, noteId),
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
      const response = await deleteBehaviorDetail(detailId, resolved);
      if (!response.ok) {
        throw new Error("delete behavior detail failed");
      }
      return detailId;
    },
    onSuccess: () => {
      if (noteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.behaviorDetails(access, noteId),
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
      behavior_label: behaviorLabel.trim(),
      behavior_description: behaviorDescription.trim(),
      behavior_error_tags: behaviorErrorTags,
    };

    if (!payload.behavior_label || !payload.behavior_description) {
      setError("행동 반응과 설명을 입력해주세요.");
      return;
    }

    try {
      await createMutation.mutateAsync(payload);
    } catch {
      setError("행동 반응 저장에 실패했습니다.");
      return;
    }

    setBehaviorLabel("");
    setBehaviorDescription("");
    setBehaviorErrorTags([]);
  }, [
    behaviorDescription,
    behaviorErrorTags,
    behaviorLabel,
    createMutation,
    ensureNoteId,
    setError,
  ]);

  const handleAddWithValues = useCallback(
    async (label: string, description: string, errors: string[]) => {
      const ensuredNoteId = ensureNoteId();
      if (!ensuredNoteId) {
        return false;
      }

      const payload = {
        note_id: ensuredNoteId,
        behavior_label: label.trim(),
        behavior_description: description.trim(),
        behavior_error_tags: errors,
      };

      if (!payload.behavior_label || !payload.behavior_description) {
        setError("행동 반응과 설명을 입력해주세요.");
        return false;
      }

      try {
        await createMutation.mutateAsync(payload);
      } catch {
        setError("행동 반응 저장에 실패했습니다.");
        return false;
      }

      setBehaviorLabel("");
      setBehaviorDescription("");
      setBehaviorErrorTags([]);
      return true;
    },
    [createMutation, ensureNoteId, setError],
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

      const payload = {
        id: detailId,
        behavior_label: editingBehaviorLabel.trim(),
        behavior_description: editingBehaviorDescription.trim(),
        behavior_error_tags: editingBehaviorErrorTags,
      };

      if (!payload.behavior_label || !payload.behavior_description) {
        setError("행동 반응과 설명을 입력해주세요.");
        setIsUpdating(false);
        return;
      }

      try {
        await updateMutation.mutateAsync(payload);
      } catch {
        setError("행동 반응 수정에 실패했습니다.");
        setIsUpdating(false);
        return;
      }

      cancelEditing();
      setIsUpdating(false);
    },
    [
      cancelEditing,
      editingBehaviorDescription,
      editingBehaviorErrorTags,
      editingBehaviorLabel,
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
        setError("행동 반응 삭제에 실패했습니다.");
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
    },
    [deleteMutation, setError],
  );

  return {
    details,
    behaviorLabel,
    behaviorDescription,
    behaviorErrorTags,
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
