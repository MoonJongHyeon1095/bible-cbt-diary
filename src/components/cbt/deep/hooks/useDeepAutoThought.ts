import { generateDeepAutoThoughts } from "@/lib/ai";
import {
  type DeepInternalContext,
  getFallbackDeepInternalContext,
} from "@/lib/gpt/deepContext";
import type { DeepAutoThoughtResult } from "@/lib/gpt/deepThought";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import type { EmotionNote } from "@/lib/types/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const buildContext = (note: EmotionNote) => buildDeepNoteContext(note);
const deepAutoThoughtCache = new Map<
  string,
  {
    items: Array<{ belief: string; emotionReason: string }>;
    autoThought: string;
    result: DeepAutoThoughtResult;
  }
>();
const deepAutoThoughtInFlight = new Set<string>();

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
  const [items, setItems] = useState<
    Array<{ belief: string; emotionReason: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const completedKeyRef = useRef<string | null>(null);

  const safeInternalContext =
    internalContext ?? getFallbackDeepInternalContext();

  const requestKey = useMemo(() => {
    const ids = [mainNote?.id, ...subNotes.map((note) => note.id)].filter(
      Boolean,
    );
    return JSON.stringify({
      userInput: userInput.trim(),
      emotion: emotion.trim(),
      ids,
      internalContext: internalContext
        ? JSON.stringify(internalContext)
        : "pending",
    });
  }, [emotion, internalContext, mainNote?.id, subNotes, userInput]);

  const loadThought = useCallback(async () => {
    if (!userInput.trim() || !emotion || !mainNote) {
      return;
    }
    if (inFlightKeyRef.current === requestKey) return;
    if (completedKeyRef.current === requestKey && items.length > 0) return;
    const cached = deepAutoThoughtCache.get(requestKey);
    if (cached) {
      setItems(cached.items);
      setAutoThought(cached.autoThought);
      setResult(cached.result);
      setLoading(false);
      return;
    }
    if (deepAutoThoughtInFlight.has(requestKey)) return;
    deepAutoThoughtInFlight.add(requestKey);
    inFlightKeyRef.current = requestKey;
    setLoading(true);
    setError(null);
    try {
      const mainContext = buildContext(mainNote);
      const subContexts = subNotes.map(buildContext);
      // 이 로그 지우지 마 절대
      console.log("[deep] auto-thought context", safeInternalContext);
      const sdt = await generateDeepAutoThoughts(
        userInput,
        emotion,
        mainContext,
        subContexts,
        safeInternalContext,
      );
      setResult(sdt);
      const nextItems = [
        {
          belief: sdt.sdt.relatedness.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.relatedness.emotion_reason,
        },
        {
          belief: sdt.sdt.competence.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.competence.emotion_reason,
        },
        {
          belief: sdt.sdt.autonomy.belief.filter(Boolean).join(" ").trim(),
          emotionReason: sdt.sdt.autonomy.emotion_reason,
        },
      ];
      setItems(nextItems);
      const nextAutoThought = nextItems.map((item) => item.belief).join(" ");
      setAutoThought(nextAutoThought);
      deepAutoThoughtCache.set(requestKey, {
        items: nextItems,
        autoThought: nextAutoThought,
        result: sdt,
      });
      completedKeyRef.current = requestKey;
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      if (inFlightKeyRef.current === requestKey) {
        inFlightKeyRef.current = null;
      }
      deepAutoThoughtInFlight.delete(requestKey);
      setLoading(false);
    }
  }, [
    emotion,
    items.length,
    mainNote,
    requestKey,
    safeInternalContext,
    subNotes,
    userInput,
  ]);

  useEffect(() => {
    if (!userInput.trim() || !emotion || !mainNote) return;
    void loadThought();
  }, [loadThought, requestKey, userInput, emotion, mainNote]);

  return {
    autoThought,
    items,
    result,
    loading,
    error,
    reload: loadThought,
  };
}
