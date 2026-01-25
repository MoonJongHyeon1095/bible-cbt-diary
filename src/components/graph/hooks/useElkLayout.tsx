"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import type { Edge, Node } from "reactflow";
import { MarkerType } from "reactflow";
import styles from "../EmotionGraphSection.module.css";

const buildOutDegreeMap = (middles: EmotionNoteMiddle[]) => {
  const map = new Map<number, number>();
  middles.forEach((middle) => {
    const count = map.get(middle.from_note_id) ?? 0;
    map.set(middle.from_note_id, count + 1);
  });
  return map;
};

const getNodeSize = (noteId: number, outDegreeMap: Map<number, number>) => {
  const outDegree = outDegreeMap.get(noteId) ?? 0;
  return 130 + Math.min(120, outDegree * 14);
};

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const mixColor = (start: [number, number, number], end: [number, number, number], t: number) => {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(start[0], end[0], clamped));
  const g = Math.round(lerp(start[1], end[1], clamped));
  const b = Math.round(lerp(start[2], end[2], clamped));
  return `rgb(${r}, ${g}, ${b})`;
};

export const useElkLayout = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
) => {
  const [elkNodes, setElkNodes] = useState<Node[]>([]);
  const [elkEdges, setElkEdges] = useState<Edge[]>([]);

  useEffect(() => {
    let cancelled = false;
    const layout = async () => {
      if (notes.length === 0) {
        setElkNodes([]);
        setElkEdges([]);
        return;
      }
      const outDegreeMap = buildOutDegreeMap(middles);
      const maxOutDegree = Math.max(1, ...outDegreeMap.values());
      const nodeIds = new Set(notes.map((note) => String(note.id)));
      const elkNodesInput = notes.map((note) => {
        const size = getNodeSize(note.id, outDegreeMap);
        return {
          id: String(note.id),
          width: size,
          height: size,
        };
      });
      const elkEdgesInput = middles
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
          "elk.algorithm": "mrtree",
          "elk.direction": "RIGHT",
          "elk.spacing.nodeNode": "240",
          "elk.spacing.edgeNode": "160",
          "elk.edgeRouting": "SPLINES",
        },
        children: elkNodesInput,
        edges: elkEdgesInput,
      };
      const result = await elk.layout(graph);
      if (cancelled) {
        return;
      }
      let minX = Infinity;
      let minY = Infinity;
      const spreadStep = 48;
      const slopeStep = 26;
      const timeOrder = notes
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((note) => String(note.id));
      const timeIndex = new Map<string, number>();
      timeOrder.forEach((id, index) => {
        timeIndex.set(id, index);
      });
      const orderedChildren = (result.children ?? [])
        .filter(
          (child: any) =>
            typeof child.x === "number" && typeof child.y === "number",
        )
        .slice()
        .sort((a: any, b: any) => a.x - b.x);
      const spreadOffsets = new Map<string, number>();
      orderedChildren.forEach((child: any, index: number) => {
        const tier = Math.floor(index / 2) + 1;
        const direction = index === 0 ? 0 : index % 2 === 1 ? 1 : -1;
        spreadOffsets.set(child.id, direction * spreadStep * tier);
      });
      result.children?.forEach((child: any) => {
        if (typeof child.x !== "number" || typeof child.y !== "number") {
          return;
        }
        minX = Math.min(minX, child.x);
        minY = Math.min(minY, child.y);
      });
      const offsetX = Number.isFinite(minX) ? minX : 0;
      const offsetY = Number.isFinite(minY) ? minY : 0;
      const padding = 12;
      const nextNodes =
        (result.children
          ?.map((child: any) => {
            if (typeof child.x !== "number" || typeof child.y !== "number") {
              return null;
            }
            const note = notes.find((item) => String(item.id) === child.id);
            if (!note) {
              return null;
            }
            const size = getNodeSize(note.id, outDegreeMap);
            const outDegree = outDegreeMap.get(note.id) ?? 0;
            const intensity =
              maxOutDegree > 0 ? Math.min(1, outDegree / maxOutDegree) : 0;
            const baseColor: [number, number, number] = [250, 245, 235];
            const indigo: [number, number, number] = [79, 70, 229];
            const fill = mixColor(baseColor, indigo, intensity * 0.6);
            const border = mixColor([124, 110, 86], indigo, intensity * 0.7);
            const labelText =
              note.title?.trim() || note.trigger_text?.trim() || "감정 노트";
            const label = (
              <div className={styles.nodeLabel}>
                <span className={styles.nodeTitle}>{labelText}</span>
                <span className={styles.nodeMeta}>#{note.id}</span>
              </div>
            );
            const spreadY = spreadOffsets.get(child.id) ?? 0;
            const timeOffset = (timeIndex.get(child.id) ?? 0) * slopeStep;
            return {
              id: String(note.id),
              type: "emotion",
              position: {
                x: child.x - offsetX + padding,
                y: child.y - offsetY + padding + spreadY + timeOffset,
              },
              data: { note, label, size, chips: [] },
              className: styles.node,
              style: {
                width: size,
                height: size,
                borderRadius: 999,
                zIndex: 2,
                background: fill,
                borderColor: border,
                color: intensity > 0.35 ? "#f7f5f1" : "#1f2328",
              },
            } as Node;
          })
          .filter((node): node is Node => node !== null)) ??
        [];

      const filteredMiddles = middles.filter(
        (middle) =>
          nodeIds.has(String(middle.from_note_id)) &&
          nodeIds.has(String(middle.to_note_id)),
      );
      const edgesBySource = new Map<string, EmotionNoteMiddle[]>();
      filteredMiddles.forEach((middle) => {
        const sourceId = String(middle.from_note_id);
        const group = edgesBySource.get(sourceId) ?? [];
        group.push(middle);
        edgesBySource.set(sourceId, group);
      });

      const nextEdges = filteredMiddles.map((middle) => {
          const sourceId = String(middle.from_note_id);
          const group = edgesBySource.get(sourceId) ?? [];
          const index = group.findIndex((item) => item.id === middle.id);
          const offset =
            group.length > 1 ? (index - (group.length - 1) / 2) * 24 : 0;
          return {
            id: `edge-${middle.id}`,
            source: sourceId,
            target: String(middle.to_note_id),
            type: "smoothstep",
            sourceHandle: "right",
            targetHandle: "left",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#8c9bff", strokeWidth: 2.2 },
            pathOptions: { offset, borderRadius: 24 },
          };
        }) as Edge[];

      setElkNodes(nextNodes);
      setElkEdges(nextEdges);
    };
    layout();
    return () => {
      cancelled = true;
    };
  }, [middles, notes]);

  return { elkNodes, elkEdges, getNodeSize };
};
