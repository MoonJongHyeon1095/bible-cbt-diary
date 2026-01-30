"use client";

import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteEmotionNote,
  fetchEmotionNote,
  saveEmotionNote,
} from "../utils/emotionNoteApi";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isNew = !noteId;

  const {
    accessMode,
    accessToken,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
  } = useEmotionNoteAccess({ noteId, setError });

  const thoughtSectionState = useEmotionNoteThoughtSection({
    noteId,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const { setDetails: setThoughtDetails } = thoughtSectionState;

  const errorSectionState = useEmotionNoteErrorSection({
    noteId,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const { setDetails: setErrorDetails } = errorSectionState;

  const alternativeSectionState = useEmotionNoteAlternativeSection({
    noteId,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const { setDetails: setAlternativeDetails } = alternativeSectionState;

  const behaviorSectionState = useEmotionNoteBehaviorSection({
    noteId,
    getAccessContext,
    requireAccessContext,
    ensureNoteId,
    setError,
  });
  const { setDetails: setBehaviorDetails } = behaviorSectionState;

  const loadNote = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      setTitle("");
      setTriggerText("");
      setThoughtDetails([]);
      setErrorDetails([]);
      setAlternativeDetails([]);
      setBehaviorDetails([]);
      return;
    }

    const access = await getAccessContext();
    if (access.mode === "blocked") {
      return;
    }

    const { response, data } = await fetchEmotionNote(noteId, access);

    if (!response.ok) {
      return;
    }
    if (!data.note) {
      setError("기록을 찾을 수 없습니다.");
      setNote(null);
      return;
    }

    setNote(data.note);
    setTitle(data.note.title);
    setTriggerText(data.note.trigger_text);
    setThoughtDetails(data.note.thought_details ?? []);
    setErrorDetails(data.note.error_details ?? []);
    setAlternativeDetails(data.note.alternative_details ?? []);
    setBehaviorDetails(data.note.behavior_details ?? []);
  }, [
    getAccessContext,
    noteId,
    setError,
    setAlternativeDetails,
    setBehaviorDetails,
    setErrorDetails,
    setThoughtDetails,
  ]);

  useEffect(() => {
    setIsLoading(true);
    loadNote().finally(() => setIsLoading(false));
  }, [loadNote, accessMode, accessToken]);

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

    const { response, data } = await saveEmotionNote(
      noteId ? { id: noteId, ...payload } : payload,
      access,
    );

    if (!response.ok || !data.ok) {
      setError(data.message ?? "저장에 실패했습니다.");
      setIsSaving(false);
      return;
    }

    if (noteId) {
      setMessage("수정되었습니다.");
      setIsSaving(false);
      await loadNote();
      return;
    }

    if (data.noteId) {
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
    router.push("/today");
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
