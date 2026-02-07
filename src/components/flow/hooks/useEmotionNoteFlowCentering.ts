"use client";

import { useCallback } from "react";
import type { Node, ReactFlowInstance } from "reactflow";
import type { RefObject } from "react";

type UseEmotionNoteFlowCenteringParams = {
  displayNodes: Node[];
  instanceRef: RefObject<ReactFlowInstance | null>;
};

export const useEmotionNoteFlowCentering = ({
  displayNodes,
  instanceRef,
}: UseEmotionNoteFlowCenteringParams) => {
  const centerOnNode = useCallback(
    (nodeId: string) => {
      const instance = instanceRef.current;
      if (!instance) return;
      const node = displayNodes.find((item) => item.id === nodeId);
      if (!node) return;
      const rawWidth =
        typeof node.style?.width === "number"
          ? node.style.width
          : Number(node.style?.width);
      const rawHeight =
        typeof node.style?.height === "number"
          ? node.style.height
          : Number(node.style?.height);
      const width = Number.isFinite(rawWidth) ? rawWidth : 0;
      const height = Number.isFinite(rawHeight) ? rawHeight : 0;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      instance.setCenter(centerX, centerY, { zoom: 1.1, duration: 600 });
    },
    [displayNodes, instanceRef],
  );

  return { centerOnNode };
};
