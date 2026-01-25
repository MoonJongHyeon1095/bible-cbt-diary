// src/lib/gpt/client.ts
"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAuthHeaders } from "@/lib/utils/buildAuthHeaders";

export type GptCallOptions = { systemPrompt?: string; model?: string };

export async function callGptText(prompt: string, opts: GptCallOptions = {}) {
  if (!prompt?.trim()) throw new Error("prompt is required");

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("로그인이 필요합니다.");

  const body: Record<string, string> = { prompt };
  if (opts.systemPrompt) body.systemPrompt = opts.systemPrompt;
  if (opts.model) body.model = opts.model;

  const res = await fetch("/api/gpt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(accessToken),
    },
    body: JSON.stringify(body),
  });

  const dataJson = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = dataJson?.error ?? `AI 요청 실패 (status: ${res.status})`;
    const err = new Error(msg);
    (err as Error & { details?: unknown }).details = dataJson?.details;
    throw err;
  }

  const text = typeof dataJson?._text === "string" ? dataJson._text.trim() : "";
  if (!text) throw new Error("AI 응답 텍스트가 비어있습니다.");
  return text;
}
