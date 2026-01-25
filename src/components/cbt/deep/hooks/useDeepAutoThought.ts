import { generateDeepAutoThoughts } from "@/lib/ai";
import type { EmotionNote } from "@/lib/types/types";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";
import type { DeepAutoThoughtResult } from "@/lib/gpt/deepThought";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import { useCallback, useEffect, useMemo, useState } from "react";

const buildContext = (note: EmotionNote) => buildDeepNoteContext(note);

type UseDeepAutoThoughtParams = {
  userInput: string;
  emotion: string;
  mainNote: EmotionNote | null;
  subNotes: EmotionNote[];
  internalContext: DeepInternalContext | null;
};

export function useDeepAutoThought({
  userInput,
  emotion,
  mainNote,
  subNotes,
  internalContext,
}: UseDeepAutoThoughtParams) {
  const [autoThought, setAutoThought] = useState("");
  const [result, setResult] = useState<DeepAutoThoughtResult | null>(null);
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
    if (!userInput.trim() || !emotion || !mainNote || !internalContext) return;
    setLoading(true);
    setError(null);
    try {
      const mainContext = buildContext(mainNote);
      const subContexts = subNotes.map(buildContext);
      const sdt = await generateDeepAutoThoughts(
        userInput,
        emotion,
        mainContext,
        subContexts,
        internalContext,
      );
      setResult(sdt);
      const beliefs = [
        ...sdt.sdt.relatedness.belief,
        ...sdt.sdt.competence.belief,
        ...sdt.sdt.autonomy.belief,
      ].filter(Boolean);
      setAutoThought(beliefs.join(" "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [emotion, internalContext, mainNote, subNotes, userInput]);

  useEffect(() => {
    if (!userInput.trim() || !emotion || !mainNote || !internalContext) return;
    void loadThought();
  }, [loadThought, requestKey, userInput, emotion, mainNote, internalContext]);

  return {
    autoThought,
    result,
    loading,
    error,
    reload: loadThought,
  };
}
