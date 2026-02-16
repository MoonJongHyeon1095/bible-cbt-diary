import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createSupabaseAdminClient } from "../../supabase/adminNode.js";
import { getUserFromAuthHeader } from "../../auth/sessionNode.js";
import { json, normalizeDeviceId, readJson } from "../_utils.js";

type PatchFlowMetaPayload = {
  flow_id?: number;
  title?: string;
  description?: string | null;
  deviceId?: string;
};

const fetchOwnedFlow = async (
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  flowId: number,
  owner: { user_id: string | null; device_id: string | null },
) => {
  const query = supabase.from("emotion_flows").select("id").eq("id", flowId);
  const { data: flow, error: flowError } = owner.user_id
    ? await query.eq("user_id", owner.user_id).maybeSingle()
    : await query.eq("device_id", owner.device_id).is("user_id", null).maybeSingle();
  return { flow, flowError };
};

export const handlePatchEmotionNoteFlowMeta = async (
  req: VercelRequest,
  res: VercelResponse,
) => {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  const payload = await readJson<PatchFlowMetaPayload>(req);
  const deviceId = normalizeDeviceId(payload.deviceId);

  if (!user && !deviceId) {
    return json(res, 401, { ok: false, message: "로그인이 필요합니다." });
  }

  const owner = user
    ? { user_id: user.id, device_id: null }
    : { user_id: null, device_id: deviceId };

  const flowId = Number(payload.flow_id ?? "");
  const title = String(payload.title ?? "").trim();
  const rawDescription =
    payload.description === null || payload.description === undefined
      ? ""
      : String(payload.description);
  const description = rawDescription.trim();

  if (Number.isNaN(flowId)) {
    return json(res, 400, { ok: false, message: "flow_id가 필요합니다." });
  }

  if (!title) {
    return json(res, 400, { ok: false, message: "제목은 비워둘 수 없습니다." });
  }

  const supabase = createSupabaseAdminClient();
  const { flow, flowError } = await fetchOwnedFlow(supabase, flowId, owner);

  if (flowError) {
    return json(res, 500, { ok: false, message: "플로우를 불러오지 못했습니다." });
  }

  if (!flow) {
    return json(res, 404, { ok: false, message: "플로우를 찾을 수 없습니다." });
  }

  const { data: updated, error: updateError } = await supabase
    .from("emotion_flows")
    .update({
      title,
      description: description.length > 0 ? description : null,
    })
    .eq("id", flowId)
    .select("id,title,description")
    .maybeSingle();

  if (updateError || !updated) {
    return json(res, 500, { ok: false, message: "플로우 정보를 저장하지 못했습니다." });
  }

  return json(res, 200, {
    ok: true,
    flow: {
      id: updated.id,
      title: updated.title ?? "",
      description: updated.description ?? null,
    },
  });
};
