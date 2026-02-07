import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, getQueryParam, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionNoteList } from "../src/lib/vercel/emotion-notes/getEmotionNoteList.js";
import { handleGetEmotionNote } from "../src/lib/vercel/emotion-notes/getEmotionNote.js";
import { handleSearchEmotionNoteList } from "../src/lib/vercel/emotion-notes/searchEmotionNoteList.js";
import { handlePostEmotionNote } from "../src/lib/vercel/emotion-notes/postEmotionNote.js";
import { handlePatchEmotionNote } from "../src/lib/vercel/emotion-notes/patchEmotionNote.js";
import { handleDeleteEmotionNote } from "../src/lib/vercel/emotion-notes/deleteEmotionNote.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === "GET") {
    const action = getQueryParam(req, "action");
    if (action === "detail") {
      return handleGetEmotionNote(req, res);
    }
    if (action === "search") {
      return handleSearchEmotionNoteList(req, res);
    }
    return handleGetEmotionNoteList(req, res);
  }

  if (req.method === "POST") {
    return handlePostEmotionNote(req, res);
  }

  if (req.method === "PATCH") {
    return handlePatchEmotionNote(req, res);
  }

  if (req.method === "DELETE") {
    return handleDeleteEmotionNote(req, res);
  }

  return methodNotAllowed(res);
}
