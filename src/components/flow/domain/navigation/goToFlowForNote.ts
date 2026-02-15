"use client";

import { postEmotionNoteFlow } from "@/lib/api/flow/postEmotionNoteFlow";
import type { AccessContext } from "@/lib/types/access";
import { flowRoutes } from "./flowRoutes";

type FlowNavigator = {
  push: (href: string) => void;
};

type GoToFlowForNoteOptions = {
  noteId: number;
  flowIds?: number[];
  access: AccessContext;
  router: FlowNavigator;
  onError?: (message: string) => void;
  onCreated?: (flowId: number) => void;
};

export const goToFlowForNote = async ({
  noteId,
  flowIds,
  access,
  router,
  onError,
  onCreated,
}: GoToFlowForNoteOptions) => {
  const ids = flowIds ?? [];

  if (ids.length === 1) {
    router.push(flowRoutes.byFlowAndNote(ids[0], noteId));
    return true;
  }

  if (ids.length > 1) {
    router.push(flowRoutes.root());
    return true;
  }

  if (access.mode === "blocked") {
    onError?.("플로우를 준비할 수 없습니다.");
    return false;
  }

  const { response, data } = await postEmotionNoteFlow(access, {
    note_id: noteId,
  });

  if (!response.ok || !data.flowId) {
    onError?.("플로우를 준비하지 못했습니다.");
    return false;
  }

  onCreated?.(data.flowId);
  router.push(flowRoutes.byFlowAndNote(data.flowId, noteId));
  return true;
};
