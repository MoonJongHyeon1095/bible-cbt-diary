import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors, getQueryParam, methodNotAllowed } from "./_utils.js";
import { handleGetEmotionNoteList } from "../src/lib/vercel/emotion-notes/getEmotionNoteList.js";
import { handleGetEmotionNote } from "../src/lib/vercel/emotion-notes/getEmotionNote.js";
import { handleSearchEmotionNoteList } from "../src/lib/vercel/emotion-notes/searchEmotionNoteList.js";
import { handleGetEmotionNoteHistoryList } from "../src/lib/vercel/emotion-notes/getEmotionNoteHistoryList.js";
import { handlePostEmotionNote } from "../src/lib/vercel/emotion-notes/postEmotionNote.js";
import { handleHideAllEmotionNotesFromHistory } from "../src/lib/vercel/emotion-notes/hideAllEmotionNotesFromHistory.js";
import { handleHideOneEmotionNoteFromHistory } from "../src/lib/vercel/emotion-notes/hideOneEmotionNoteFromHistory.js";
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
    if (action === "history") {
      return handleGetEmotionNoteHistoryList(req, res);
    }
    return handleGetEmotionNoteList(req, res);
  }

  if (req.method === "POST") {
    return handlePostEmotionNote(req, res);
  }

  if (req.method === "PATCH") {
    const action = getQueryParam(req, "action");
    if (action === "hide-one-history") {
      return handleHideOneEmotionNoteFromHistory(req, res);
    }
    if (action === "hide-all-history") {
      return handleHideAllEmotionNotesFromHistory(req, res);
    }
    return handlePatchEmotionNote(req, res);
  }

  if (req.method === "DELETE") {
    return handleDeleteEmotionNote(req, res);
  }

  return methodNotAllowed(res);
}
