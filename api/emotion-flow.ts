import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGetEmotionNoteFlow } from "../src/lib/vercel/flow/getEmotionNoteFlow.js";
import { handleGetEmotionFlowList } from "../src/lib/vercel/flow/getEmotionNoteFlowList.js";
import { handlePostEmotionNoteFlow } from "../src/lib/vercel/flow/postEmotionNoteFlow.js";
import {
  handleDeleteEmotionFlow,
  handleDeleteEmotionFlowNote,
} from "../src/lib/vercel/flow/deleteEmotionNoteFlow.js";
import {
  getQueryParam,
  handleCors,
  json,
  methodNotAllowed,
  readJson,
} from "./_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "POST") {
    const payload = await readJson(req);
    return handlePostEmotionNoteFlow(req, res, payload);
  }

  if (req.method === "GET") {
    const action = getQueryParam(req, "action");
    if (action === "list") {
      return handleGetEmotionFlowList(req, res);
    }

    if (action === "detail") {
      return handleGetEmotionNoteFlow(req, res);
    }
  }

  if (req.method === "DELETE") {
    const action = getQueryParam(req, "action");
    if (action === "flow") {
      return handleDeleteEmotionFlow(req, res);
    }
    if (action === "note") {
      return handleDeleteEmotionFlowNote(req, res);
    }
    return json(res, 400, { ok: false, message: "지원하지 않는 action입니다." });
  }

  return methodNotAllowed(res);
}
