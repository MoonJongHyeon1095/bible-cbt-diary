"use client";

import type {
  EmotionNote,
  EmotionNoteMiddle,
} from "@/lib/types/emotionNoteTypes";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import type { Edge, Node } from "reactflow";
import type { FlowDetailNodeData } from "../nodes/FlowDetailNode";
import { buildFlowLayout } from "../domain/layout/buildFlowLayout";

const buildElkSpec = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
) => {
  const nodeIds = new Set(notes.map((note) => String(note.id)));
  const outDegreeMap = new Map<number, number>();
  middles.forEach((middle) => {
    outDegreeMap.set(
      middle.from_note_id,
      (outDegreeMap.get(middle.from_note_id) ?? 0) + 1,
    );
  });

  const children = notes.map((note) => {
    const outDegree = outDegreeMap.get(note.id) ?? 0;
    const size = 130 + Math.min(120, outDegree * 14);
    return {
      id: String(note.id),
      width: size,
      height: size,
    };
  });

  const edges = middles
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

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "mrtree",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "320",
      "elk.spacing.edgeNode": "220",
      "elk.edgeRouting": "SPLINES",
    },
    children,
    edges,
  };
};

export const useFlowDetailLayout = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
  themeColor?: [number, number, number],
) => {
  const [elkNodes, setElkNodes] = useState<Node<FlowDetailNodeData>[]>([]);
  const [elkEdges, setElkEdges] = useState<Edge[]>([]);
  const [axisLabels, setAxisLabels] = useState<
    { id: string; x: number; label: string }[]
  >([]);
  const [axisY, setAxisY] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const layout = async () => {
      if (notes.length === 0) {
        setElkNodes([]);
        setElkEdges([]);
        setAxisLabels([]);
        setAxisY(null);
        return;
      }

      const elk = new ELK();
      const spec = buildElkSpec(notes, middles);
      const result = await elk.layout(spec);

      if (cancelled) return;

      const next = buildFlowLayout({
        notes,
        middles,
        elkChildren: result.children ?? [],
        themeColor,
      });

      setElkNodes(next.nodes);
      setElkEdges(next.edges);
      setAxisLabels(next.axisLabels);
      setAxisY(next.axisY);
    };

    void layout();

    return () => {
      cancelled = true;
    };
  }, [middles, notes, themeColor]);

  return { elkNodes, elkEdges, axisLabels, axisY };
};
