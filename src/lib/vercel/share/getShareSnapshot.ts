import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getQueryParam, json } from "../_utils.js";

export const handleGetShareSnapshot = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const requestId = req.headers["x-request-id"];
  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("[share-snap-shots] admin client init failed", {
      requestId,
      error,
    });
    return json(res, 500, { ok: false, message: "Supabase admin client init failed" });
  }

  const publicId = getQueryParam(req, "sid");
  if (!publicId) {
    return json(res, 400, { share: null, message: "sid가 필요합니다." });
  }

  const { data, error } = await supabase
    .from("share_snap_shots")
    .select("public_id,title,trigger_text,sections,expires_at")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    console.error("[share-snap-shots] public fetch failed", {
      requestId,
      publicId,
      error,
    });
    return json(res, 500, { share: null, message: "공유 내용을 불러오지 못했습니다." });
  }

  if (!data) {
    return json(res, 404, { share: null, message: "공유 내용을 찾을 수 없습니다." });
  }

  if (data.expires_at && new Date(data.expires_at) <= new Date()) {
    return json(res, 404, { share: null, message: "공유 내용이 만료되었습니다." });
  }

  return json(res, 200, {
    share: {
      public_id: data.public_id,
      title: data.title,
      trigger_text: data.trigger_text,
      sections: data.sections ?? {},
    },
  });
};
