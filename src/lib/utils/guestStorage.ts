import type {
  EmotionNote,
  EmotionNoteAlternativeDetail,
  EmotionNoteBehaviorDetail,
  EmotionNoteDetail,
  EmotionNoteErrorDetail,
  EmotionNoteWithDetails,
} from "@/lib/types/types";
import type { SessionHistory } from "@/lib/types/cbtTypes";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import { getDeviceId } from "@/lib/utils/deviceId";
import { getKstDayRange, getKstMonthRange } from "@/lib/utils/time";

type GuestStore = {
  version: 1;
  lastNoteId: number;
  lastDetailId: number;
  lastHistoryId: number;
  notes: EmotionNoteWithDetails[];
  histories: SessionHistory[];
};

type GuestNoteSaveData = {
  ok: boolean;
  noteId: number | null;
  message?: string;
};

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "guest-emotion-store";

const createEmptyStore = (): GuestStore => ({
  version: STORAGE_VERSION,
  lastNoteId: 0,
  lastDetailId: 0,
  lastHistoryId: 0,
  notes: [],
  histories: [],
});

const canUseLocalStorage = () => {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__guest_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const isGuestStorageAvailable = () => {
  if (!canUseLocalStorage()) return false;
  const deviceId = getDeviceId();
  return deviceId !== "unknown";
};

const getStorageKey = () => {
  const deviceId = getDeviceId();
  if (deviceId === "unknown") {
    return null;
  }
  return `${STORAGE_PREFIX}:${deviceId}`;
};

const readStore = (): GuestStore => {
  if (!canUseLocalStorage()) {
    return createEmptyStore();
  }
  const key = getStorageKey();
  if (!key) {
    return createEmptyStore();
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return createEmptyStore();
  }
  try {
    const parsed = JSON.parse(raw) as GuestStore;
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      return createEmptyStore();
    }
    return parsed;
  } catch {
    return createEmptyStore();
  }
};

const writeStore = (store: GuestStore) => {
  const key = getStorageKey();
  if (!key || !canUseLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(store));
};

const updateStore = <T>(updater: (store: GuestStore) => [GuestStore, T]) => {
  const store = readStore();
  const [nextStore, result] = updater(store);
  writeStore(nextStore);
  return result;
};

const createOkResponse = () => new Response(null, { status: 200 });
const createErrorResponse = (status = 400) =>
  new Response(null, { status });

const buildNoteSummary = (note: EmotionNoteWithDetails): EmotionNote => {
  const emotionLabels = Array.from(
    new Set(
      (note.thought_details ?? [])
        .map((detail) => detail.emotion)
        .filter(Boolean),
    ),
  );
  const errorLabels = Array.from(
    new Set(
      (note.error_details ?? [])
        .map((detail) => detail.error_label)
        .filter(Boolean),
    ),
  );
  const behaviorLabels = Array.from(
    new Set(
      (note.behavior_details ?? [])
        .map((detail) => detail.behavior_label)
        .filter(Boolean),
    ),
  );

  return {
    ...note,
    emotion_labels: emotionLabels,
    error_labels: errorLabels,
    behavior_labels: behaviorLabels,
  };
};

export const getGuestNotesForDate = (date: Date) => {
  const { startIso, endIso } = getKstDayRange(date);
  return getGuestNotesByRange(startIso, endIso);
};

export const getGuestNotesByMonth = (date: Date) => {
  const { startIso, endIso } = getKstMonthRange(date);
  return getGuestNotesByRange(startIso, endIso);
};

export const getGuestNotesByRange = (startIso: string, endIso: string) => {
  const store = readStore();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const notes = store.notes
    .filter((note) => {
      const createdAt = new Date(note.created_at).getTime();
      return createdAt >= start && createdAt < end;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map(buildNoteSummary);

  return {
    response: createOkResponse(),
    data: { notes },
  };
};

export const getGuestNote = (noteId: number) => {
  const store = readStore();
  const note = store.notes.find((item) => item.id === noteId) ?? null;
  return {
    response: createOkResponse(),
    data: { note },
  };
};

export const saveGuestNote = (payload: {
  id?: number | null;
  title: string;
  trigger_text: string;
  created_at?: string;
}): { response: Response; data: GuestNoteSaveData } => {
  return updateStore<{ response: Response; data: GuestNoteSaveData }>((store) => {
    const trimmedTitle = payload.title.trim();
    const trimmedTrigger = payload.trigger_text.trim();
    if (!trimmedTitle || !trimmedTrigger) {
      return [
        store,
        {
          response: createErrorResponse(400),
          data: {
            ok: false,
            noteId: null,
            message: "필수 입력값이 누락되었습니다.",
          },
        },
      ];
    }

    if (payload.id) {
      const noteIndex = store.notes.findIndex(
        (note) => note.id === payload.id,
      );
      if (noteIndex < 0) {
        return [
          store,
          {
            response: createErrorResponse(404),
            data: {
              ok: false,
              noteId: null,
              message: "기록을 찾을 수 없습니다.",
            },
          },
        ];
      }
      const nextNotes = [...store.notes];
      const updated = {
        ...nextNotes[noteIndex],
        title: trimmedTitle,
        trigger_text: trimmedTrigger,
      };
      nextNotes[noteIndex] = updated;
      const nextStore = { ...store, notes: nextNotes };
      return [
        nextStore,
        {
          response: createOkResponse(),
          data: { ok: true, noteId: updated.id },
        },
      ];
    }

    const newId = store.lastNoteId + 1;
    const createdAt = payload.created_at ?? new Date().toISOString();
    const nextNote: EmotionNoteWithDetails = {
      id: newId,
      title: trimmedTitle,
      trigger_text: trimmedTrigger,
      created_at: createdAt,
      group_id: null,
      thought_details: [],
      error_details: [],
      alternative_details: [],
      behavior_details: [],
    };
    const nextStore = {
      ...store,
      lastNoteId: newId,
      notes: [nextNote, ...store.notes],
    };
    return [
      nextStore,
      { response: createOkResponse(), data: { ok: true, noteId: newId } },
    ];
  });
};

export const deleteGuestNote = (noteId: number) => {
  return updateStore((store) => {
    const nextNotes = store.notes.filter((note) => note.id !== noteId);
    return [
      { ...store, notes: nextNotes },
      { response: createOkResponse() },
    ];
  });
};

const addDetailBase = <T extends { id: number; note_id: number; created_at: string }>(
  noteId: number,
  buildDetail: (id: number) => T,
  mutate: (note: EmotionNoteWithDetails, detail: T) => EmotionNoteWithDetails,
) =>
  updateStore((store) => {
    const noteIndex = store.notes.findIndex((note) => note.id === noteId);
    if (noteIndex < 0) {
      return [store, { response: createErrorResponse(404) }];
    }
    const newDetailId = store.lastDetailId + 1;
    const detail = buildDetail(newDetailId);
    const nextNotes = [...store.notes];
    nextNotes[noteIndex] = mutate(nextNotes[noteIndex], detail);
    return [
      { ...store, lastDetailId: newDetailId, notes: nextNotes },
      { response: createOkResponse() },
    ];
  });

export const addGuestThoughtDetail = (payload: {
  note_id: number;
  automatic_thought: string;
  emotion: string;
  created_at?: string;
}) =>
  addDetailBase(
    payload.note_id,
    (id) => ({
      id,
      note_id: payload.note_id,
      automatic_thought: payload.automatic_thought,
      emotion: payload.emotion,
      created_at: payload.created_at ?? new Date().toISOString(),
    }),
    (note, detail) => ({
      ...note,
      thought_details: [...(note.thought_details ?? []), detail],
    }),
  );

export const addGuestErrorDetail = (payload: {
  note_id: number;
  error_label: string;
  error_description: string;
  created_at?: string;
}) =>
  addDetailBase(
    payload.note_id,
    (id) => ({
      id,
      note_id: payload.note_id,
      error_label: payload.error_label,
      error_description: payload.error_description,
      created_at: payload.created_at ?? new Date().toISOString(),
    }),
    (note, detail) => ({
      ...note,
      error_details: [...(note.error_details ?? []), detail],
    }),
  );

export const addGuestAlternativeDetail = (payload: {
  note_id: number;
  alternative: string;
  created_at?: string;
}) =>
  addDetailBase(
    payload.note_id,
    (id) => ({
      id,
      note_id: payload.note_id,
      alternative: payload.alternative,
      created_at: payload.created_at ?? new Date().toISOString(),
    }),
    (note, detail) => ({
      ...note,
      alternative_details: [...(note.alternative_details ?? []), detail],
    }),
  );

export const addGuestBehaviorDetail = (payload: {
  note_id: number;
  behavior_label: string;
  behavior_description: string;
  error_tags?: string[] | null;
  created_at?: string;
}) =>
  addDetailBase(
    payload.note_id,
    (id) => ({
      id,
      note_id: payload.note_id,
      behavior_label: payload.behavior_label,
      behavior_description: payload.behavior_description,
      error_tags: payload.error_tags ?? null,
      created_at: payload.created_at ?? new Date().toISOString(),
    }),
    (note, detail) => ({
      ...note,
      behavior_details: [...(note.behavior_details ?? []), detail],
    }),
  );

type DetailKey =
  | "thought_details"
  | "error_details"
  | "alternative_details"
  | "behavior_details";
type DetailByKey = {
  thought_details: EmotionNoteDetail;
  error_details: EmotionNoteErrorDetail;
  alternative_details: EmotionNoteAlternativeDetail;
  behavior_details: EmotionNoteBehaviorDetail;
};

const updateDetailBase = <K extends DetailKey>(
  detailId: number,
  update: (detail: DetailByKey[K]) => DetailByKey[K],
  key: K,
) =>
  updateStore((store) => {
    let updated = false;
    const nextNotes = store.notes.map((note) => {
      const details = (note[key] ?? []) as DetailByKey[K][];
      const nextDetails = details.map((detail) => {
        if (detail.id !== detailId) {
          return detail;
        }
        updated = true;
        return update(detail);
      });
      return updated ? { ...note, [key]: nextDetails } : note;
    });
    return [
      { ...store, notes: nextNotes },
      { response: updated ? createOkResponse() : createErrorResponse(404) },
    ];
  });

export const updateGuestThoughtDetail = (payload: {
  id: number;
  automatic_thought: string;
  emotion: string;
}) =>
  updateDetailBase(payload.id, (detail) => ({
    ...detail,
    automatic_thought: payload.automatic_thought,
    emotion: payload.emotion,
  }), "thought_details");

export const updateGuestErrorDetail = (payload: {
  id: number;
  error_label: string;
  error_description: string;
}) =>
  updateDetailBase(payload.id, (detail) => ({
    ...detail,
    error_label: payload.error_label,
    error_description: payload.error_description,
  }), "error_details");

export const updateGuestAlternativeDetail = (payload: {
  id: number;
  alternative: string;
}) =>
  updateDetailBase(payload.id, (detail) => ({
    ...detail,
    alternative: payload.alternative,
  }), "alternative_details");

export const updateGuestBehaviorDetail = (payload: {
  id: number;
  behavior_label: string;
  behavior_description: string;
  error_tags?: string[] | null;
}) =>
  updateDetailBase(payload.id, (detail) => ({
    ...detail,
    behavior_label: payload.behavior_label,
    behavior_description: payload.behavior_description,
    error_tags: payload.error_tags ?? null,
  }), "behavior_details");

const deleteDetailBase = (
  detailId: number,
  key: "thought_details" | "error_details" | "alternative_details" | "behavior_details",
) =>
  updateStore((store) => {
    let removed = false;
    const nextNotes = store.notes.map((note) => {
      const details = note[key] ?? [];
      const nextDetails = details.filter((detail) => {
        if (detail.id === detailId) {
          removed = true;
          return false;
        }
        return true;
      });
      return removed ? { ...note, [key]: nextDetails } : note;
    });
    return [
      { ...store, notes: nextNotes },
      { response: removed ? createOkResponse() : createErrorResponse(404) },
    ];
  });

export const deleteGuestThoughtDetail = (detailId: number) =>
  deleteDetailBase(detailId, "thought_details");
export const deleteGuestErrorDetail = (detailId: number) =>
  deleteDetailBase(detailId, "error_details");
export const deleteGuestAlternativeDetail = (detailId: number) =>
  deleteDetailBase(detailId, "alternative_details");
export const deleteGuestBehaviorDetail = (detailId: number) =>
  deleteDetailBase(detailId, "behavior_details");

export const getGuestThoughtDetails = (noteId: number) => {
  const store = readStore();
  const note = store.notes.find((item) => item.id === noteId);
  return {
    response: note ? createOkResponse() : createErrorResponse(404),
    data: { details: note?.thought_details ?? [] },
  };
};

export const getGuestErrorDetails = (noteId: number) => {
  const store = readStore();
  const note = store.notes.find((item) => item.id === noteId);
  return {
    response: note ? createOkResponse() : createErrorResponse(404),
    data: { details: note?.error_details ?? [] },
  };
};

export const getGuestAlternativeDetails = (noteId: number) => {
  const store = readStore();
  const note = store.notes.find((item) => item.id === noteId);
  return {
    response: note ? createOkResponse() : createErrorResponse(404),
    data: { details: note?.alternative_details ?? [] },
  };
};

export const getGuestBehaviorDetails = (noteId: number) => {
  const store = readStore();
  const note = store.notes.find((item) => item.id === noteId);
  return {
    response: note ? createOkResponse() : createErrorResponse(404),
    data: { details: note?.behavior_details ?? [] },
  };
};

export const saveGuestMinimalSession = (payload: {
  title: string;
  trigger_text: string;
  emotion: string;
  automatic_thought: string;
  alternative: string;
  error_label?: string;
  error_description?: string;
  created_at?: string;
}) => {
  const noteResult = saveGuestNote({
    title: payload.title,
    trigger_text: payload.trigger_text,
    created_at: payload.created_at,
  });
  if (!noteResult.data?.noteId) {
    return { response: createErrorResponse(500), data: { noteId: null } };
  }
  const noteId = noteResult.data.noteId;
  addGuestThoughtDetail({
    note_id: noteId,
    automatic_thought: payload.automatic_thought,
    emotion: payload.emotion,
    created_at: payload.created_at,
  });
  if (payload.error_label) {
    addGuestErrorDetail({
      note_id: noteId,
      error_label: payload.error_label,
      error_description: payload.error_description ?? "",
      created_at: payload.created_at,
    });
  }
  addGuestAlternativeDetail({
    note_id: noteId,
    alternative: payload.alternative,
    created_at: payload.created_at,
  });
  return { response: createOkResponse(), data: { noteId } };
};

export const listGuestSessionHistories = (options?: {
  limit?: number;
  offset?: number;
}) => {
  const store = readStore();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const sorted = [...store.histories].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const slice = sorted.slice(offset, offset + limit);
  return {
    response: createOkResponse(),
    data: { histories: slice },
  };
};

export const saveGuestSessionHistory = (history: SessionHistory) =>
  updateStore((store) => {
    const id =
      history.id ||
      String(store.lastHistoryId + 1);
    const nextHistory = { ...history, id };
    const nextStore = {
      ...store,
      lastHistoryId: Math.max(store.lastHistoryId, Number(id) || store.lastHistoryId + 1),
      histories: [nextHistory, ...store.histories],
    };
    return [
      nextStore,
      { response: createOkResponse(), data: { ok: true } },
    ];
  });

export const deleteGuestSessionHistory = (id: string) =>
  updateStore((store) => {
    const nextHistories = store.histories.filter((item) => item.id !== id);
    return [
      { ...store, histories: nextHistories },
      { response: createOkResponse() },
    ];
  });

export const deleteAllGuestSessionHistories = () =>
  updateStore((store) => [
    { ...store, histories: [] },
    { response: createOkResponse() },
  ]);

export const hasGuestData = () => {
  const store = readStore();
  return store.notes.length > 0 || store.histories.length > 0;
};

export const clearGuestData = () => {
  const key = getStorageKey();
  if (!key || !canUseLocalStorage()) return;
  window.localStorage.removeItem(key);
};

export const uploadGuestData = async (accessToken: string) => {
  const store = readStore();
  if (!store.notes.length && !store.histories.length) {
    return { ok: true };
  }

  const headers = {
    "Content-Type": "application/json",
    ...buildAuthHeaders(accessToken),
  };

  try {
    for (const note of store.notes) {
      const noteRes = await fetch("/api/emotion-notes", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: note.title,
          trigger_text: note.trigger_text,
          created_at: note.created_at,
        }),
      });
      if (!noteRes.ok) {
        return { ok: false };
      }
      const notePayload = (await noteRes.json()) as {
        noteId?: number | null;
      };
      const noteId = notePayload.noteId;
      if (!noteId) {
        return { ok: false };
      }

      for (const detail of note.thought_details ?? []) {
        const response = await fetch("/api/emotion-note-details", {
          method: "POST",
          headers,
          body: JSON.stringify({
            note_id: noteId,
            automatic_thought: detail.automatic_thought,
            emotion: detail.emotion,
            created_at: detail.created_at,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
      }

      for (const detail of note.error_details ?? []) {
        const response = await fetch("/api/emotion-error-details", {
          method: "POST",
          headers,
          body: JSON.stringify({
            note_id: noteId,
            error_label: detail.error_label,
            error_description: detail.error_description,
            created_at: detail.created_at,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
      }

      for (const detail of note.alternative_details ?? []) {
        const response = await fetch("/api/emotion-alternative-details", {
          method: "POST",
          headers,
          body: JSON.stringify({
            note_id: noteId,
            alternative: detail.alternative,
            created_at: detail.created_at,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
      }

      for (const detail of note.behavior_details ?? []) {
        const response = await fetch("/api/emotion-behavior-details", {
          method: "POST",
          headers,
          body: JSON.stringify({
            note_id: noteId,
            behavior_label: detail.behavior_label,
            behavior_description: detail.behavior_description,
            error_tags: detail.error_tags ?? null,
            created_at: detail.created_at,
          }),
        });
        if (!response.ok) {
          return { ok: false };
        }
      }
    }

    for (const history of store.histories) {
      const response = await fetch("/api/session-history", {
        method: "POST",
        headers,
        body: JSON.stringify({
          timestamp: history.timestamp,
          user_input: history.userInput,
          emotion_thought_pairs: history.emotionThoughtPairs,
          selected_cognitive_errors: history.selectedCognitiveErrors,
          selected_alternative_thought: history.selectedAlternativeThought,
          selected_behavior: history.selectedBehavior ?? null,
          bible_verse: history.bibleVerse ?? null,
        }),
      });
      if (!response.ok) {
        return { ok: false };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("guest upload failed:", error);
    return { ok: false };
  }
};
