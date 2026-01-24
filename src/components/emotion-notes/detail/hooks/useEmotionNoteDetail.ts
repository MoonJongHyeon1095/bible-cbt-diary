"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmotionNote } from "@/lib/types";
import {
  deleteEmotionNote,
  fetchEmotionNote,
  saveEmotionNote,
} from "../utils/emotionNoteApi";
import useAlternativeSection from "./useAlternativeSection";
import useBehaviorSection from "./useBehaviorSection";
import useEmotionNoteAccess from "./useEmotionNoteAccess";
import useErrorSection from "./useErrorSection";
import useThoughtSection from "./useThoughtSection";

export default function useEmotionNoteDetail(noteId?: number | null) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [note, setNote] = useState<EmotionNote | null>(null);
  const [title, setTitle] = useState("");
  const [triggerText, setTriggerText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isNew = !noteId;

  const { supabase, getAccessToken, requireAccessToken, ensureNoteId } =
    useEmotionNoteAccess({ noteId, setError });

  const thoughtSectionState = useThoughtSection({
    noteId,
    getAccessToken,
    requireAccessToken,
    ensureNoteId,
    setError,
  });

  const errorSectionState = useErrorSection({
    noteId,
    getAccessToken,
    requireAccessToken,
    ensureNoteId,
    setError,
  });

  const alternativeSectionState = useAlternativeSection({
    noteId,
    getAccessToken,
    requireAccessToken,
    ensureNoteId,
    setError,
  });

  const behaviorSectionState = useBehaviorSection({
    noteId,
    getAccessToken,
    requireAccessToken,
    ensureNoteId,
    setError,
  });

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUserEmail(data.user?.email ?? null);
  }, [supabase]);

  const loadNote = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      setTitle("");
      setTriggerText("");
      thoughtSectionState.setDetails([]);
      errorSectionState.setDetails([]);
      alternativeSectionState.setDetails([]);
      behaviorSectionState.setDetails([]);
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    const { response, data } = await fetchEmotionNote(noteId, accessToken);

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
    thoughtSectionState.setDetails(data.note.thought_details ?? []);
    errorSectionState.setDetails(data.note.error_details ?? []);
    alternativeSectionState.setDetails(data.note.alternative_details ?? []);
    behaviorSectionState.setDetails(data.note.behavior_details ?? []);
  }, [
    alternativeSectionState.setDetails,
    behaviorSectionState.setDetails,
    errorSectionState.setDetails,
    getAccessToken,
    noteId,
    setError,
    thoughtSectionState.setDetails,
  ]);

  useEffect(() => {
    setIsLoading(true);
    loadUser()
      .then(loadNote)
      .finally(() => setIsLoading(false));
  }, [loadNote, loadUser]);

  const handleSaveNote = async () => {
    setError("");
    setMessage("");
    setIsSaving(true);

    const accessToken = await requireAccessToken();
    if (!accessToken) {
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
      accessToken,
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
      router.push(`/detail/${data.noteId}`);
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
      return;
    }

    const shouldDelete = window.confirm("이 기록을 삭제할까요?");
    if (!shouldDelete) {
      return;
    }

    const accessToken = await requireAccessToken();
    if (!accessToken) {
      return;
    }

    const response = await deleteEmotionNote(noteId, accessToken);

    if (!response.ok) {
      setError("삭제에 실패했습니다.");
      return;
    }

    router.push("/today");
  };

  const thoughtSection = {
    details: thoughtSectionState.details,
    editingThoughtId: thoughtSectionState.editingThoughtId,
    editingThoughtText: thoughtSectionState.editingThoughtText,
    editingEmotionText: thoughtSectionState.editingEmotionText,
    onStartEditing: thoughtSectionState.startEditing,
    onCancelEditing: thoughtSectionState.cancelEditing,
    onUpdate: thoughtSectionState.handleUpdate,
    onDelete: thoughtSectionState.handleDelete,
    onChangeEditingThoughtText: thoughtSectionState.setEditingThoughtText,
  };

  const errorSection = {
    details: errorSectionState.details,
    editingErrorId: errorSectionState.editingErrorId,
    editingErrorLabel: errorSectionState.editingErrorLabel,
    editingErrorDescription: errorSectionState.editingErrorDescription,
    onStartEditing: errorSectionState.startEditing,
    onCancelEditing: errorSectionState.cancelEditing,
    onUpdate: errorSectionState.handleUpdate,
    onDelete: errorSectionState.handleDelete,
    onChangeEditingErrorDescription: errorSectionState.setEditingErrorDescription,
  };

  const alternativeSection = {
    details: alternativeSectionState.details,
    editingAlternativeId: alternativeSectionState.editingAlternativeId,
    editingAlternativeText: alternativeSectionState.editingAlternativeText,
    onStartEditing: alternativeSectionState.startEditing,
    onCancelEditing: alternativeSectionState.cancelEditing,
    onUpdate: alternativeSectionState.handleUpdate,
    onDelete: alternativeSectionState.handleDelete,
    onChangeEditingAlternativeText: alternativeSectionState.setEditingAlternativeText,
  };

  const behaviorSection = {
    details: behaviorSectionState.details,
    editingBehaviorId: behaviorSectionState.editingBehaviorId,
    editingBehaviorLabel: behaviorSectionState.editingBehaviorLabel,
    editingBehaviorDescription: behaviorSectionState.editingBehaviorDescription,
    onStartEditing: behaviorSectionState.startEditing,
    onCancelEditing: behaviorSectionState.cancelEditing,
    onUpdate: behaviorSectionState.handleUpdate,
    onDelete: behaviorSectionState.handleDelete,
    onChangeEditingBehaviorDescription:
      behaviorSectionState.setEditingBehaviorDescription,
  };

  return {
    userEmail,
    note,
    isNew,
    isLoading,
    isSaving,
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
