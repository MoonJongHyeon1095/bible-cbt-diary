import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed, readJson } from "./_utils.js";
import { handlePostMinimalSession } from "../src/lib/vercel/cbt/postMinimalSession.js";
import { handlePostDeepSession } from "../src/lib/vercel/cbt/postDeepSession.js";
import { handlePostDeepMontage } from "../src/lib/vercel/cbt/postDeepMontage.js";

type DeepPayload = {
  mode?: "deep" | "minimal" | "montage";
  deviceId?: string;
  title?: string;
  trigger_text?: string;
  emotion?: string;
  automatic_thought?: string;
  selected_cognitive_error?: { title?: string; detail?: string } | null;
  selected_alternative_thought?: string;
  main_id?: number;
  sub_ids?: number[];
  flow_id?: number | null;
};

type MinimalPayload = {
  mode?: "deep" | "minimal" | "montage";
  deviceId?: string;
  title?: string;
  triggerText?: string;
  emotion?: string;
  automaticThought?: string;
  alternativeThought?: string;
  cognitiveError?: { title?: string; detail?: string } | null;
};

type MontagePayload = {
  mode?: "deep" | "minimal" | "montage";
  deviceId?: string;
  flow_id?: number | null;
  main_note_id?: number;
  sub_note_ids?: number[];
  atoms_jsonb?: unknown;
  montage_caption?: string;
  montage_jsonb?: unknown;
  freeze_frames_jsonb?: unknown;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const payload = await readJson<DeepPayload & MinimalPayload & MontagePayload>(req);
  const mode =
    payload.mode === "minimal"
      ? "minimal"
      : payload.mode === "montage"
        ? "montage"
        : "deep";

  if (mode === "minimal") {
    return handlePostMinimalSession(req, res, payload);
  }

  if (mode === "montage") {
    return handlePostDeepMontage(req, res, payload);
  }

  return handlePostDeepSession(req, res, payload);
}
