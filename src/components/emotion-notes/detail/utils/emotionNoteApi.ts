"use client";

import type {
  EmotionNoteAlternativeDetail,
  EmotionNoteBehaviorDetail,
  EmotionNoteDetail,
  EmotionNoteErrorDetail,
  EmotionNoteWithDetails,
} from "@/lib/types/types";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export const fetchEmotionNote = async (noteId: number, accessToken: string) => {
  const response = await fetch(`/api/emotion-notes?id=${noteId}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { note: EmotionNoteWithDetails | null })
    : { note: null };
  return { response, data };
};

export const fetchThoughtDetails = async (
  noteId: number,
  accessToken: string,
) => {
  const response = await fetch(`/api/emotion-note-details?note_id=${noteId}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { details: EmotionNoteDetail[] })
    : { details: [] };
  return { response, data };
};

export const fetchErrorDetails = async (
  noteId: number,
  accessToken: string,
) => {
  const response = await fetch(`/api/emotion-error-details?note_id=${noteId}`, {
    headers: buildAuthHeaders(accessToken),
  });

  const data = response.ok
    ? ((await response.json()) as { details: EmotionNoteErrorDetail[] })
    : { details: [] };
  return { response, data };
};

export const fetchAlternativeDetails = async (
  noteId: number,
  accessToken: string,
) => {
  const response = await fetch(
    `/api/emotion-alternative-details?note_id=${noteId}`,
    {
      headers: buildAuthHeaders(accessToken),
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
  accessToken: string,
) => {
  const response = await fetch(
    `/api/emotion-behavior-details?note_id=${noteId}`,
    {
      headers: buildAuthHeaders(accessToken),
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
  accessToken: string,
) => {
  const bodyPayload = payload.id
    ? payload
    : { title: payload.title, trigger_text: payload.trigger_text };

  const response = await fetch("/api/emotion-notes", {
    method: payload.id ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
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

export const deleteEmotionNote = async (noteId: number, accessToken: string) =>
  fetch("/api/emotion-notes", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ id: noteId }),
  });

export const createThoughtDetail = async (
  payload: { note_id: number; automatic_thought: string; emotion: string },
  accessToken: string,
) =>
  fetch("/api/emotion-note-details", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const updateThoughtDetail = async (
  payload: { id: number; automatic_thought: string; emotion: string },
  accessToken: string,
) =>
  fetch("/api/emotion-note-details", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const deleteThoughtDetail = async (
  detailId: number,
  accessToken: string,
) =>
  fetch("/api/emotion-note-details", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ id: detailId }),
  });

export const createErrorDetail = async (
  payload: { note_id: number; error_label: string; error_description: string },
  accessToken: string,
) =>
  fetch("/api/emotion-error-details", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const updateErrorDetail = async (
  payload: { id: number; error_label: string; error_description: string },
  accessToken: string,
) =>
  fetch("/api/emotion-error-details", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const deleteErrorDetail = async (
  detailId: number,
  accessToken: string,
) =>
  fetch("/api/emotion-error-details", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ id: detailId }),
  });

export const createAlternativeDetail = async (
  payload: { note_id: number; alternative: string },
  accessToken: string,
) =>
  fetch("/api/emotion-alternative-details", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const updateAlternativeDetail = async (
  payload: { id: number; alternative: string },
  accessToken: string,
) =>
  fetch("/api/emotion-alternative-details", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const deleteAlternativeDetail = async (
  detailId: number,
  accessToken: string,
) =>
  fetch("/api/emotion-alternative-details", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ id: detailId }),
  });

export const createBehaviorDetail = async (
  payload: {
    note_id: number;
    behavior_label: string;
    behavior_description: string;
  },
  accessToken: string,
) =>
  fetch("/api/emotion-behavior-details", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const updateBehaviorDetail = async (
  payload: { id: number; behavior_label: string; behavior_description: string },
  accessToken: string,
) =>
  fetch("/api/emotion-behavior-details", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(payload),
  });

export const deleteBehaviorDetail = async (
  detailId: number,
  accessToken: string,
) =>
  fetch("/api/emotion-behavior-details", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify({ id: detailId }),
  });
