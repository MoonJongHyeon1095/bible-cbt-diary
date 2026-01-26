import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";

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

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    systemPrompt?: string;
    model?: string;
    deviceId?: string;
  };
  const deviceId =
    typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!user && !deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "prompt too long" }, { status: 400 });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not found" },
      { status: 500 },
    );
  }

  const requestedModel =
    typeof body?.model === "string" ? body.model.trim() : "";
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
    return NextResponse.json(
      {
        error: `AI request failed (status: ${response.status})`,
        details: data,
      },
      { status: response.status },
    );
  }

  const text =
    typeof (data as { output_text?: string })?.output_text === "string"
      ? (data as { output_text: string }).output_text
      : extractTextFromResponsesPayload(data) ?? "";

  return NextResponse.json({ ...(data as object), _text: text });
}
