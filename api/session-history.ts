import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, methodNotAllowed, readJson } from "./_utils.js";
import { handleGetSessionHistories } from "../src/lib/vercel/session-history/getSessionHistories.js";
import { handlePostSessionHistory } from "../src/lib/vercel/session-history/postSessionHistory.js";
import { handleDeleteSessionHistory } from "../src/lib/vercel/session-history/deleteSessionHistory.js";
import { handleDeleteAllSessionHistories } from "../src/lib/vercel/session-history/deleteAllSessionHistories.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    return handleGetSessionHistories(req, res);
  }

  if (req.method === "POST") {
    return handlePostSessionHistory(req, res);
  }

  if (req.method === "DELETE") {
    const payload = await readJson<{ id?: string | number; all?: boolean }>(req);
    if (payload.all === true) {
      return handleDeleteAllSessionHistories(req, res);
    }
    return handleDeleteSessionHistory(req, res);
  }

  return methodNotAllowed(res);
}
