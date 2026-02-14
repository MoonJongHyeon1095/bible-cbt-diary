"use client";

import type { AccessContext } from "@/lib/types/access";
import { buildApiUrl } from "@/lib/utils/apiBase";
import { resolveAccess } from "@/lib/api/_helpers";

export async function saveDeepMontageAPI(
  access: AccessContext,
  payload: {
    flow_id: number | null;
    main_note_id: number;
    sub_note_ids: number[];
    atoms_jsonb: unknown[];
    montage_caption: string;
    montage_jsonb: {
      sequenceText: unknown[];
      cutLogicText: unknown[];
    };
    freeze_frames_jsonb: unknown[];
  },
) {
  const resolved = resolveAccess(access);
  if (resolved.kind === "blocked") {
    return { ok: false, payload: {} as { montageId?: number } };
  }

  const body = {
    mode: "montage",
    ...payload,
    ...(resolved.kind === "guest" ? { deviceId: resolved.deviceId } : {}),
  };

  const res = await fetch(buildApiUrl("/api/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.kind === "auth" ? resolved.headers : {}),
    },
    body: JSON.stringify(body),
  });

  const response = await res.json().catch(() => ({}));
  return { ok: res.ok, payload: response } as {
    ok: boolean;
    payload: { montageId?: number };
  };
}
