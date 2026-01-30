import { useEffect, useMemo, useRef, useState } from "react";
import { createDeepInternalContext } from "@/lib/ai";
import { buildDeepNoteContext } from "@/lib/gpt/deepThought.types";
import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { DeepInternalContext } from "@/lib/gpt/deepContext";

const contextCache = new Map<string, DeepInternalContext>();
const inFlight = new Map<string, Promise<DeepInternalContext>>();

const buildKey = (mainNote: EmotionNote | null, subNotes: EmotionNote[]) => {
  if (!mainNote) return "";
  const ids = [mainNote.id, ...subNotes.map((note) => note.id)];
  return ids.join("|");
};

export function useCbtDeepInternalContext(
  mainNote: EmotionNote | null,
  subNotes: EmotionNote[],
) {
  const key = useMemo(() => buildKey(mainNote, subNotes), [mainNote, subNotes]);
  const [context, setContext] = useState<DeepInternalContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!key || !mainNote) {
      setContext(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = contextCache.get(key);
    if (cached) {
      setContext(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const load = async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const mainContext = buildDeepNoteContext(mainNote);
        const subContexts = subNotes.map(buildDeepNoteContext);
        const inFlightPromise =
          inFlight.get(key) ??
          createDeepInternalContext(mainContext, subContexts);
        inFlight.set(key, inFlightPromise);
        const result = await inFlightPromise;
        if (requestId !== requestIdRef.current) return;
        contextCache.set(key, result);
        setContext(result);
        setLoading(false);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        setLoading(false);
      } finally {
        inFlight.delete(key);
      }
    };

    void load();
  }, [key, mainNote, subNotes]);

  return { context, error, loading };
}
