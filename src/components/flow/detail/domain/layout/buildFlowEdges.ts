import type { EmotionNoteMiddle } from "@/lib/types/emotionNoteTypes";
import type { Edge } from "reactflow";
import { MarkerType } from "reactflow";

const EDGE_OFFSET_STEP = 32;
const EDGE_WIDTH = 2.2;

export const buildFlowEdges = (
  middles: EmotionNoteMiddle[],
  edgeColor: string,
): Edge[] => {
  const edgesBySource = new Map<string, EmotionNoteMiddle[]>();
  middles.forEach((middle) => {
    const sourceId = String(middle.from_note_id);
    const group = edgesBySource.get(sourceId) ?? [];
    group.push(middle);
    edgesBySource.set(sourceId, group);
  });

  return middles.map((middle) => {
    const sourceId = String(middle.from_note_id);
    const group = edgesBySource.get(sourceId) ?? [];
    const index = group.findIndex((item) => item.id === middle.id);
    const offset =
      group.length > 1
        ? (index - (group.length - 1) / 2) * EDGE_OFFSET_STEP
        : 0;

    return {
      id: `edge-${middle.id}`,
      source: sourceId,
      target: String(middle.to_note_id),
      type: "smoothstep",
      sourceHandle: "right",
      targetHandle: "left",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: edgeColor, strokeWidth: EDGE_WIDTH },
      pathOptions: { offset, borderRadius: 24 },
    };
  });
};
