// src/lib/gpt/client.ts
"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { postGpt } from "@/lib/api/gpt/postGpt";
import { getDeviceId } from "@/lib/storage/device/deviceId";
import {
  readTokenSessionUsage,
  writeTokenSessionUsage,
} from "@/lib/storage/token/sessionUsage";
import { syncTokenUsage } from "@/lib/api/token-usage/postTokenUsage";

export type GptCallOptions = {
  systemPrompt?: string;
  model?: string;
  noteProposal?: boolean;
};

export async function callGptText(prompt: string, opts: GptCallOptions = {}) {
  if (!prompt?.trim()) throw new Error("prompt is required");

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const { response, data: dataJson } = await postGpt({
    prompt,
    systemPrompt: opts.systemPrompt,
    model: opts.model,
    accessToken,
    deviceId: accessToken ? null : getDeviceId(),
  });

  if (!response.ok) {
    const msg = dataJson?.error ?? `AI 요청 실패 (status: ${response.status})`;
    const err = new Error(msg);
    (err as Error & { details?: unknown }).details = dataJson?.details;
    throw err;
  }

  if (dataJson?.usage) {
    const prevUsage = readTokenSessionUsage() ?? {
      total_tokens: 0,
      input_tokens: 0,
      output_tokens: 0,
      request_count: 0,
      note_proposal_count: 0,
    };
    const inputTokens = Number(dataJson.usage.input_tokens || 0);
    const outputTokens = Number(dataJson.usage.output_tokens || 0);
    const totalTokens =
      Number(dataJson.usage.total_tokens || 0) || inputTokens + outputTokens;
    const next = {
      total_tokens: totalTokens + prevUsage.total_tokens,
      input_tokens: inputTokens + prevUsage.input_tokens,
      output_tokens: outputTokens + prevUsage.output_tokens,
      request_count: prevUsage.request_count + 1,
      note_proposal_count: prevUsage.note_proposal_count ?? 0,
    };

    // 절대 이 로그를 지우지 마
    console.log(
      "request inputTokens: ",
      inputTokens,
      "request outputTokens:",
      outputTokens,
      "request totalTokens:",
      totalTokens,
    );
    console.log(
      "session inputTokens:",
      next.input_tokens,
      "session outputTokens:",
      next.output_tokens,
      "session totalTokens:",
      next.total_tokens,
    );
    console.log("request_count:", next.request_count);
    if (opts.noteProposal) {
      try {
        await syncTokenUsage({
          total_tokens: totalTokens,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          request_count: 1,
          note_proposal_count: 1,
        });
      } catch {
        // ignore
      }
    } else {
      writeTokenSessionUsage(next);
    }
  }

  const text = typeof dataJson?._text === "string" ? dataJson._text.trim() : "";
  if (!text) throw new Error("AI 응답 텍스트가 비어있습니다.");

  // 절대 이 로그를 지우지 마
  console.log("AI response text:", text);
  return text;
}
