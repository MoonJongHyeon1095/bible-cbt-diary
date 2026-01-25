import { useCallback, useEffect, useMemo, useState } from "react";
import { generateDeepAutoThoughtAndSummary } from "@/lib/ai";
import type { EmotionNote } from "@/lib/types";

const buildContext = (note: EmotionNote) => {
  return {
    id: note.id,
    triggerText: note.trigger_text,
    emotions: (note.thought_details ?? [])
      .map((detail) => detail.emotion)
      .filter(Boolean),
    automaticThoughts: (note.thought_details ?? [])
      .map((detail) => detail.automatic_thought)
      .filter(Boolean),
    cognitiveErrors: (note.error_details ?? []).map((detail) => ({
      title: detail.error_label,
      detail: detail.error_description,
    })),
    alternatives: (note.alternative_details ?? [])
      .map((detail) => detail.alternative)
      .filter(Boolean),
  };
};

type UseDeepAutoThoughtParams = {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote | null;
  subNotes: EmotionNote[];
};

export function useDeepAutoThought({
  userInput,
  emotion,
  mainNote,
  subNotes,
}: UseDeepAutoThoughtParams) {
  const [autoThought, setAutoThought] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestKey = useMemo(() => {
    const ids = [mainNote?.id, ...subNotes.map((note) => note.id)].filter(
      Boolean,
    );
    return JSON.stringify({
      userInput: userInput.trim(),
      emotion: emotion.trim(),
      ids,
    });
  }, [emotion, mainNote?.id, subNotes, userInput]);

  const loadThought = useCallback(async () => {
    if (!userInput.trim() || !emotion || !mainNote) return;
    setLoading(true);
    setError(null);
    try {
      const mainContext = buildContext(mainNote);
      const subContexts = subNotes.map(buildContext);
      const result = await generateDeepAutoThoughtAndSummary(
        userInput,
        emotion,
        mainContext,
        subContexts,
      );
      setAutoThought(result.autoThought);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [emotion, mainNote, subNotes, userInput]);

  useEffect(() => {
    if (!userInput.trim() || !emotion || !mainNote) return;
    void loadThought();
  }, [loadThought, requestKey, userInput, emotion, mainNote]);

  return {
    autoThought,
    summary,
    loading,
    error,
    reload: loadThought,
  };
}
