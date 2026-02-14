import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed } from "./_utils.js";
import { handlePostGpt } from "../src/lib/vercel/gpt/postGpt.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }
  return handlePostGpt(req, res);
}
