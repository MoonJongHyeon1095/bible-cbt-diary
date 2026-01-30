import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromAuthHeader } from "../src/lib/auth/sessionNode";
import { json, methodNotAllowed, readJson, handleCors } from "./_utils";

const allowedModels = new Set(["gpt-4.1-mini", "gpt-4o-mini", "gpt-5-nano"]);

function extractTextFromResponsesPayload(payload: unknown): string | null {
  try {
    const output = (payload as { output?: unknown })?.output;
    if (!Array.isArray(output)) return null;
    return output
      .flatMap((item: { content?: Array<{ text?: string }> }) =>
        item?.content ?? [],
      )
      .map((content: { text?: string }) => content?.text)
      .filter((text): text is string => typeof text === "string")
      .join("\n")
      .trim();
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);
  const body = await readJson<{
    prompt?: string;
    systemPrompt?: string;
    model?: string;
    deviceId?: string;
  }>(req);
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!user && !deviceId) {
    return json(res, 401, { error: "Unauthorized" });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return json(res, 400, { error: "prompt is required" });
  }
  if (prompt.length > 4000) {
    return json(res, 400, { error: "prompt too long" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return json(res, 500, { error: "OPENAI_API_KEY not found" });
  }

  const requestedModel = typeof body?.model === "string" ? body.model.trim() : "";
  const model = allowedModels.has(requestedModel)
    ? requestedModel
    : "gpt-4.1-mini";

  const input = body?.systemPrompt
    ? [
        { role: "system", content: String(body.systemPrompt) },
        { role: "user", content: prompt },
      ]
    : [{ role: "user", content: prompt }];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input,
      temperature: 0.3,
      max_output_tokens: 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json(res, response.status, {
      error: `AI request failed (status: ${response.status})`,
      details: data,
    });
  }

  const text =
    typeof (data as { output_text?: string })?.output_text === "string"
      ? (data as { output_text: string }).output_text
      : extractTextFromResponsesPayload(data) ?? "";

  return json(res, 200, { ...(data as object), _text: text });
}
