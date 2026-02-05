import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "./_utils.js";
import { handlePostGpt } from "../src/lib/vercel/gpt/postGpt.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  return handlePostGpt(req, res);
}
