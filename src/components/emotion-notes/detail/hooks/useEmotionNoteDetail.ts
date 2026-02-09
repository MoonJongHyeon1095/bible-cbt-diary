"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteEmotionNote } from "@/lib/api/emotion-notes/deleteEmotionNote";
import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import { createEmotionNote } from "@/lib/api/emotion-notes/postEmotionNote";
import { updateEmotionNote } from "@/lib/api/emotion-notes/patchEmotionNote";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import useEmotionNoteAlternativeSection from "./useEmotionNoteAlternativeSection";
import useEmotionNoteBehaviorSection from "./useEmotionNoteBehaviorSection";
import useEmotionNoteAccess from "./useEmotionNoteAccess";
import useEmotionNoteErrorSection from "./useEmotionNoteErrorSection";
import useEmotionNoteThoughtSection from "./useEmotionNoteThoughtSection";

export default function useEmotionNoteDetail(noteId?: number | null) {
  const router = useRouter();
  const [note, setNote] = useState<EmotionNote | null>(null);
  const [title, setTitle] = useState("");
  const [triggerText, setTriggerText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastLoadedIdRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const isNew = !noteId;

  const {
    accessMode,
    accessToken,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
  } = useEmotionNoteAccess({ noteId, setError });

  const access = useMemo<AccessContext>(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  const thoughtSectionState = useEmotionNoteThoughtSection({
    noteId,
    access,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const errorSectionState = useEmotionNoteErrorSection({
    noteId,
    access,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });

  const alternativeSectionState = useEmotionNoteAlternativeSection({
    noteId,
    access,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });

  const behaviorSectionState = useEmotionNoteBehaviorSection({
    noteId,
    access,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const noteQuery = useQuery({
    queryKey:
      noteId && access.mode !== "blocked"
        ? queryKeys.emotionNotes.detail(access, noteId)
        : ["noop"],
    queryFn: async () => {
      if (!noteId) {
        return null;
      }
      const { response, data } = await fetchEmotionNote(noteId, access);
      if (!response.ok) {
        throw new Error("emotion_note fetch failed");
      }
      if (!data.note) {
        throw new Error("note not found");
      }
      return data.note;
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
  });

  const isLoading = noteQuery.isPending || noteQuery.isFetching;

  useEffect(() => {
    if (!noteId) {
      setNote(null);
      setTitle("");
      setTriggerText("");
      lastLoadedIdRef.current = null;
      return;
    }
    if (noteQuery.data) {
      setNote(noteQuery.data);
      if (lastLoadedIdRef.current !== noteQuery.data.id) {
        setTitle(noteQuery.data.title);
        setTriggerText(noteQuery.data.trigger_text);
        lastLoadedIdRef.current = noteQuery.data.id;
      }
      return;
    }
    if (noteQuery.isError) {
      setError("기록을 찾을 수 없습니다.");
      setNote(null);
    }
  }, [noteId, noteQuery.data, noteQuery.isError]);

  const handleSaveNote = async () => {
    setError("");
    setMessage("");
    setIsSaving(true);

    const access = await requireAccessContext();
    if (!access) {
      setIsSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      trigger_text: triggerText.trim(),
    };

    if (!payload.title || !payload.trigger_text) {
      setError("제목과 트리거를 입력해주세요.");
      setIsSaving(false);
      return;
    }

    const { response, data } = noteId
      ? await updateEmotionNote(
          {
            id: noteId,
            ...payload,
          },
          access,
        )
      : await createEmotionNote(payload, access);

    if (!response.ok || !data.ok) {
      setError(data.message ?? "저장에 실패했습니다.");
      setIsSaving(false);
      return;
    }

    if (noteId) {
      setMessage("수정되었습니다.");
      setIsSaving(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
      return;
    }

    if (data.noteId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
      router.push(`/detail?id=${data.noteId}`);
      return;
    }

    setMessage("기록이 저장되었습니다.");
    setIsSaving(false);
  };

  const handleGoToList = useCallback(() => {
    router.push("/today");
  }, [router]);

  const handleDeleteNote = async () => {
    if (!noteId) {
      return false;
    }

    setIsDeleting(true);
    const access = await requireAccessContext();
    if (!access) {
      setIsDeleting(false);
      return false;
    }

    const response = await deleteEmotionNote(noteId, access);

    if (!response.ok) {
      setError("삭제에 실패했습니다.");
      setIsDeleting(false);
      return false;
    }

    setIsDeleting(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.emotionNotes.all });
    return true;
  };

  const thoughtSection = {
    detailThought: thoughtSectionState.detailThought,
    detailEmotion: thoughtSectionState.detailEmotion,
    details: thoughtSectionState.details,
    editingThoughtId: thoughtSectionState.editingThoughtId,
    editingThoughtText: thoughtSectionState.editingThoughtText,
    editingEmotionText: thoughtSectionState.editingEmotionText,
    isUpdating: thoughtSectionState.isUpdating,
    deletingId: thoughtSectionState.deletingId,
    handleAdd: thoughtSectionState.handleAdd,
    handleAddWithValues: thoughtSectionState.handleAddWithValues,
    onStartEditing: thoughtSectionState.startEditing,
    onCancelEditing: thoughtSectionState.cancelEditing,
    onUpdate: thoughtSectionState.handleUpdate,
    onDelete: thoughtSectionState.handleDelete,
    setDetailThought: thoughtSectionState.setDetailThought,
    setDetailEmotion: thoughtSectionState.setDetailEmotion,
    onChangeEditingThoughtText: thoughtSectionState.setEditingThoughtText,
  };

  const errorSection = {
    details: errorSectionState.details,
    errorLabel: errorSectionState.errorLabel,
    errorDescription: errorSectionState.errorDescription,
    editingErrorId: errorSectionState.editingErrorId,
    editingErrorLabel: errorSectionState.editingErrorLabel,
    editingErrorDescription: errorSectionState.editingErrorDescription,
    isUpdating: errorSectionState.isUpdating,
    deletingId: errorSectionState.deletingId,
    handleAdd: errorSectionState.handleAdd,
    handleAddWithValues: errorSectionState.handleAddWithValues,
    setErrorLabel: errorSectionState.setErrorLabel,
    setErrorDescription: errorSectionState.setErrorDescription,
    onStartEditing: errorSectionState.startEditing,
    onCancelEditing: errorSectionState.cancelEditing,
    onUpdate: errorSectionState.handleUpdate,
    onDelete: errorSectionState.handleDelete,
    onChangeEditingErrorDescription:
      errorSectionState.setEditingErrorDescription,
  };

  const alternativeSection = {
    alternativeText: alternativeSectionState.alternativeText,
    details: alternativeSectionState.details,
    editingAlternativeId: alternativeSectionState.editingAlternativeId,
    editingAlternativeText: alternativeSectionState.editingAlternativeText,
    isUpdating: alternativeSectionState.isUpdating,
    deletingId: alternativeSectionState.deletingId,
    handleAdd: alternativeSectionState.handleAdd,
    handleAddWithValues: alternativeSectionState.handleAddWithValues,
    onStartEditing: alternativeSectionState.startEditing,
    onCancelEditing: alternativeSectionState.cancelEditing,
    onUpdate: alternativeSectionState.handleUpdate,
    onDelete: alternativeSectionState.handleDelete,
    setAlternativeText: alternativeSectionState.setAlternativeText,
    onChangeEditingAlternativeText:
      alternativeSectionState.setEditingAlternativeText,
  };

  const behaviorSection = {
    behaviorLabel: behaviorSectionState.behaviorLabel,
    behaviorDescription: behaviorSectionState.behaviorDescription,
    behaviorErrorTags: behaviorSectionState.behaviorErrorTags,
    details: behaviorSectionState.details,
    editingBehaviorId: behaviorSectionState.editingBehaviorId,
    editingBehaviorLabel: behaviorSectionState.editingBehaviorLabel,
    editingBehaviorDescription: behaviorSectionState.editingBehaviorDescription,
    isUpdating: behaviorSectionState.isUpdating,
    deletingId: behaviorSectionState.deletingId,
    handleAdd: behaviorSectionState.handleAdd,
    handleAddWithValues: behaviorSectionState.handleAddWithValues,
    onStartEditing: behaviorSectionState.startEditing,
    onCancelEditing: behaviorSectionState.cancelEditing,
    onUpdate: behaviorSectionState.handleUpdate,
    onDelete: behaviorSectionState.handleDelete,
    setBehaviorLabel: behaviorSectionState.setBehaviorLabel,
    setBehaviorDescription: behaviorSectionState.setBehaviorDescription,
    setBehaviorErrorTags: behaviorSectionState.setBehaviorErrorTags,
    onChangeEditingBehaviorDescription:
      behaviorSectionState.setEditingBehaviorDescription,
  };

  return {
    accessMode,
    note,
    isNew,
    isLoading,
    isSaving,
    isDeleting,
    message,
    error,
    title,
    setTitle,
    triggerText,
    setTriggerText,
    handleSaveNote,
    handleGoToList,
    handleDeleteNote,
    thoughtSection,
    errorSection,
    alternativeSection,
    behaviorSection,
  };
}
