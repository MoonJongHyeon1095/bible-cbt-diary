"use client";

import { postEmotionNoteFlow } from "@/lib/api/flow/postEmotionNoteFlow";

type FlowNavigator = {
  push: (href: string) => void;
};

type GoToFlowForNoteOptions = {
  noteId: number;
  flowIds?: number[];
  accessToken?: string | null;
  router: FlowNavigator;
  onError?: (message: string) => void;
};

export const goToFlowForNote = async ({
  noteId,
  flowIds,
  accessToken,
  router,
  onError,
}: GoToFlowForNoteOptions) => {
  const ids = flowIds ?? [];

  if (ids.length === 1) {
    router.push(`/flow?flowId=${ids[0]}&noteId=${noteId}`);
    return true;
  }

  if (ids.length > 1) {
    router.push(`/flow?noteId=${noteId}`);
    return true;
  }

  if (!accessToken) {
    onError?.("플로우를 준비할 수 없습니다.");
    return false;
  }

  const { response, data } = await postEmotionNoteFlow(accessToken, {
    note_id: noteId,
  });
  if (!response.ok || !data.flowId) {
    onError?.("플로우를 준비하지 못했습니다.");
    return false;
  }

  router.push(`/flow?flowId=${data.flowId}&noteId=${noteId}`);
  return true;
};
