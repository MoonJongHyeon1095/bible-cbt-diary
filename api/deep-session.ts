import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed, readJson } from "./_utils.js";
import { handlePostMinimalSession } from "../src/lib/vercel/cbt/postMinimalSession.js";
import { handlePostDeepSession } from "../src/lib/vercel/cbt/postDeepSession.js";

type DeepPayload = {
  mode?: "deep" | "minimal";
  deviceId?: string;
  title?: string;
  trigger_text?: string;
  emotion?: string;
  automatic_thought?: string;
  selected_cognitive_error?: { title?: string; detail?: string } | null;
  selected_alternative_thought?: string;
  main_id?: number;
  sub_ids?: number[];
  group_id?: number | null;
};

type MinimalPayload = {
  mode?: "deep" | "minimal";
  deviceId?: string;
  title?: string;
  triggerText?: string;
  emotion?: string;
  automaticThought?: string;
  alternativeThought?: string;
  cognitiveError?: { title?: string; detail?: string } | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const payload = await readJson<DeepPayload & MinimalPayload>(req);
  const mode = payload.mode === "minimal" ? "minimal" : "deep";

  if (mode === "minimal") {
    return handlePostMinimalSession(req, res, payload);
  }

  return handlePostDeepSession(req, res, payload);
}
