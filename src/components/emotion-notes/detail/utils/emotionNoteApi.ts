"use client";

import type { AccessContext } from "@/lib/types/access";
import type {
  EmotionNoteAlternativeDetail,
  EmotionNoteBehaviorDetail,
  EmotionNoteDetail,
  EmotionNoteErrorDetail,
  EmotionNoteWithDetails,
} from "@/lib/types/emotionNoteTypes";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";
import {
  addGuestAlternativeDetail,
  addGuestBehaviorDetail,
  addGuestErrorDetail,
  addGuestThoughtDetail,
  deleteGuestAlternativeDetail,
  deleteGuestBehaviorDetail,
  deleteGuestErrorDetail,
  deleteGuestNote,
  deleteGuestThoughtDetail,
  getGuestAlternativeDetails,
  getGuestBehaviorDetails,
  getGuestErrorDetails,
  getGuestNote,
  getGuestThoughtDetails,
  saveGuestNote,
  updateGuestAlternativeDetail,
  updateGuestBehaviorDetail,
  updateGuestErrorDetail,
  updateGuestThoughtDetail,
} from "@/lib/utils/guestStorage";

export const fetchEmotionNote = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return getGuestNote(noteId);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { note: null as EmotionNoteWithDetails | null },
    };
  }
  const response = await fetch(buildApiUrl(`/api/emotion-notes?id=${noteId}`), {
    headers: buildAuthHeaders(access.accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { note: EmotionNoteWithDetails | null })
    : { note: null };
  return { response, data };
};

export const fetchThoughtDetails = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return getGuestThoughtDetails(noteId);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { details: [] as EmotionNoteDetail[] },
    };
  }
  const response = await fetch(
    buildApiUrl(`/api/emotion-note-details?note_id=${noteId}`),
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { details: EmotionNoteDetail[] })
    : { details: [] };
  return { response, data };
};

export const fetchErrorDetails = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return getGuestErrorDetails(noteId);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { details: [] as EmotionNoteErrorDetail[] },
    };
  }
  const response = await fetch(
    buildApiUrl(`/api/emotion-error-details?note_id=${noteId}`),
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as { details: EmotionNoteErrorDetail[] })
    : { details: [] };
  return { response, data };
};

export const fetchAlternativeDetails = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return getGuestAlternativeDetails(noteId);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { details: [] as EmotionNoteAlternativeDetail[] },
    };
  }
  const response = await fetch(
    buildApiUrl(`/api/emotion-alternative-details?note_id=${noteId}`),
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as {
        details: EmotionNoteAlternativeDetail[];
      })
    : { details: [] };
  return { response, data };
};

export const fetchBehaviorDetails = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return getGuestBehaviorDetails(noteId);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { details: [] as EmotionNoteBehaviorDetail[] },
    };
  }
  const response = await fetch(
    buildApiUrl(`/api/emotion-behavior-details?note_id=${noteId}`),
    {
      headers: buildAuthHeaders(access.accessToken),
    },
  );

  const data = response.ok
    ? ((await response.json()) as {
        details: EmotionNoteBehaviorDetail[];
      })
    : { details: [] };
  return { response, data };
};

export const saveEmotionNote = async (
  payload: { title: string; trigger_text: string; id?: number | null },
  access: AccessContext,
): Promise<{
  response: Response;
  data: { ok: boolean; message?: string; noteId?: number | null };
}> => {
  if (access.mode === "guest") {
    return saveGuestNote(payload);
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return {
      response: new Response(null, { status: 401 }),
      data: { ok: false, noteId: null },
    };
  }
  const bodyPayload = payload.id
    ? payload
    : { title: payload.title, trigger_text: payload.trigger_text };

  const response = await fetch(buildApiUrl("/api/emotion-notes"), {
    method: payload.id ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(access.accessToken),
    },
    body: JSON.stringify(bodyPayload),
  });

  const data = (await response.json()) as {
    ok: boolean;
    message?: string;
    noteId?: number | null;
  };

  return { response, data };
};

export const deleteEmotionNote = async (
  noteId: number,
  access: AccessContext,
) => {
  if (access.mode === "guest") {
    return deleteGuestNote(noteId).response;
  }
  if (access.mode !== "auth" || !access.accessToken) {
    return new Response(null, { status: 401 });
  }
  return fetch(buildApiUrl("/api/emotion-notes"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(access.accessToken),
    },
    body: JSON.stringify({ id: noteId }),
  });
};

export const createThoughtDetail = async (
  payload: { note_id: number; automatic_thought: string; emotion: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? addGuestThoughtDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-note-details"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const updateThoughtDetail = async (
  payload: { id: number; automatic_thought: string; emotion: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? updateGuestThoughtDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-note-details"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const deleteThoughtDetail = async (
  detailId: number,
  access: AccessContext,
) =>
  access.mode === "guest"
    ? deleteGuestThoughtDetail(detailId).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-note-details"), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify({ id: detailId }),
        });

export const createErrorDetail = async (
  payload: { note_id: number; error_label: string; error_description: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? addGuestErrorDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-error-details"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const updateErrorDetail = async (
  payload: { id: number; error_label: string; error_description: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? updateGuestErrorDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-error-details"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const deleteErrorDetail = async (
  detailId: number,
  access: AccessContext,
) =>
  access.mode === "guest"
    ? deleteGuestErrorDetail(detailId).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-error-details"), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify({ id: detailId }),
        });

export const createAlternativeDetail = async (
  payload: { note_id: number; alternative: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? addGuestAlternativeDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-alternative-details"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const updateAlternativeDetail = async (
  payload: { id: number; alternative: string },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? updateGuestAlternativeDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-alternative-details"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const deleteAlternativeDetail = async (
  detailId: number,
  access: AccessContext,
) =>
  access.mode === "guest"
    ? deleteGuestAlternativeDetail(detailId).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-alternative-details"), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify({ id: detailId }),
        });

export const createBehaviorDetail = async (
  payload: {
    note_id: number;
    behavior_label: string;
    behavior_description: string;
    error_tags?: string[] | null;
  },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? addGuestBehaviorDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-behavior-details"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const updateBehaviorDetail = async (
  payload: {
    id: number;
    behavior_label: string;
    behavior_description: string;
    error_tags?: string[] | null;
  },
  access: AccessContext,
) =>
  access.mode === "guest"
    ? updateGuestBehaviorDetail(payload).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-behavior-details"), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify(payload),
        });

export const deleteBehaviorDetail = async (
  detailId: number,
  access: AccessContext,
) =>
  access.mode === "guest"
    ? deleteGuestBehaviorDetail(detailId).response
    : access.mode !== "auth" || !access.accessToken
      ? new Response(null, { status: 401 })
      : fetch(buildApiUrl("/api/emotion-behavior-details"), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(access.accessToken),
          },
          body: JSON.stringify({ id: detailId }),
        });
