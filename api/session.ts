import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed, readJson } from "./_utils.js";
import { handlePostMinimalSession } from "../src/lib/vercel/session/postMinimalSession.js";

type MinimalPayload = {
  mode?: "minimal";
  deviceId?: string;
  title?: string;
  triggerText?: string;
  emotion?: string;
  emotions?: string[];
  emotionType?: "positive" | "negative";
  automaticThought?: string;
  alternativeThought?: string;
  cognitiveError?: { title?: string; detail?: string } | null;
  sdtType?: "autonomy" | "relatedness" | "competence" | null;
  sdtEmpathyText?: string;
  reflectionQuestion?: string;
  behaviorLabel?: string;
  behaviorDescription?: string;
  behaviorChecklist?: string[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const payload = await readJson<MinimalPayload>(req);
  return handlePostMinimalSession(req, res, payload);
}
