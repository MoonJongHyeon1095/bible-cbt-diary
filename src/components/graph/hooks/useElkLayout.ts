"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";

const buildInDegreeMap = (middles: EmotionNoteMiddle[]) => {
  const map = new Map<number, number>();
  middles.forEach((middle) => {
    const count = map.get(middle.to_note_id) ?? 0;
    map.set(middle.to_note_id, count + 1);
  });
  return map;
};

const getNodeSize = (noteId: number, inDegreeMap: Map<number, number>) => {
  const inDegree = inDegreeMap.get(noteId) ?? 0;
  return 110 + Math.min(120, inDegree * 14);
};

export const useElkLayout = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
) => {
  const [elkPositions, setElkPositions] = useState(
    () => new Map<string, { x: number; y: number }>(),
  );

  useEffect(() => {
    let cancelled = false;
    const layout = async () => {
      if (notes.length === 0) {
        setElkPositions(new Map());
        return;
      }
      const inDegreeMap = buildInDegreeMap(middles);
      const nodeIds = new Set(notes.map((note) => String(note.id)));
      const elkNodes = notes.map((note) => {
        const size = getNodeSize(note.id, inDegreeMap);
        const layoutSize = size + 80;
        return {
          id: String(note.id),
          width: layoutSize,
          height: layoutSize,
        };
      });
      const elkEdges = middles
        .filter(
          (middle) =>
            nodeIds.has(String(middle.from_note_id)) &&
            nodeIds.has(String(middle.to_note_id)),
        )
        .map((middle) => ({
          id: `edge-${middle.id}`,
          sources: [String(middle.from_note_id)],
          targets: [String(middle.to_note_id)],
        }));
      const elk = new ELK();
      const graph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": "RIGHT",
          "elk.layered.spacing.nodeNodeBetweenLayers": "180",
          "elk.layered.spacing.edgeNodeBetweenLayers": "120",
          "elk.layered.spacing.edgeEdgeBetweenLayers": "60",
          "elk.spacing.edgeNode": "80",
          "elk.spacing.nodeNode": "120",
          "elk.edgeRouting": "ORTHOGONAL",
        },
        children: elkNodes,
        edges: elkEdges,
      };
      const result = await elk.layout(graph);
      if (cancelled) {
        return;
      }
      const next = new Map<string, { x: number; y: number }>();
      result.children?.forEach((child: any) => {
        if (typeof child.x === "number" && typeof child.y === "number") {
          next.set(String(child.id), { x: child.x, y: child.y });
        }
      });
      setElkPositions(next);
    };
    layout();
    return () => {
      cancelled = true;
    };
  }, [middles, notes]);

  return { elkPositions, getNodeSize };
};
