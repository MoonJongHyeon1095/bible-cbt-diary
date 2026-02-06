"use client";

import type { EmotionNote, EmotionNoteMiddle } from "@/lib/types/emotionNoteTypes";
import type { ElkNode } from "elkjs/lib/elk-api";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import type { Edge, Node } from "reactflow";
import { MarkerType } from "reactflow";
import styles from "../EmotionNoteFlowSection.module.css";

const BASE_NODE_SIZE = 130;
const NODE_SIZE_STEP = 14;
const NODE_SIZE_MAX_EXTRA = 120;
const SPREAD_STEP = 140;
const SLOPE_STEP = 90;
const FLOW_PADDING = 12;
const EDGE_OFFSET_STEP = 32;
const EDGE_WIDTH = 2.2;
const INDIGO: [number, number, number] = [79, 70, 229];
const BASE_BLUE: [number, number, number] = [230, 232, 246];
const BORDER_BASE: [number, number, number] = [150, 160, 214];

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
  return (
    BASE_NODE_SIZE + Math.min(NODE_SIZE_MAX_EXTRA, outDegree * NODE_SIZE_STEP)
  );
};

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const mixColor = (
  start: [number, number, number],
  end: [number, number, number],
  t: number,
) => {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(start[0], end[0], clamped));
  const g = Math.round(lerp(start[1], end[1], clamped));
  const b = Math.round(lerp(start[2], end[2], clamped));
  return `rgb(${r}, ${g}, ${b})`;
};

const formatFlowDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

const toRgba = (rgb: string, alpha: number) =>
  rgb.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);

const createTimeIndex = (notes: EmotionNote[]) => {
  const order = notes
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((note) => String(note.id));
  const map = new Map<string, number>();
  order.forEach((id, index) => {
    map.set(id, index);
  });
  return map;
};

const buildSpreadOffsets = (children: { id: string }[]) => {
  const offsets = new Map<string, number>();
  children.forEach((child, index) => {
    const tier = Math.floor(index / 2) + 1;
    const direction = index === 0 ? 0 : index % 2 === 1 ? 1 : -1;
    offsets.set(child.id, direction * SPREAD_STEP * tier);
  });
  return offsets;
};

type PositionedElkNode = ElkNode & { x: number; y: number };

const isPositionedElkNode = (node: ElkNode): node is PositionedElkNode =>
  Number.isFinite(node.x) && Number.isFinite(node.y);

export const useEmotionNoteFlowLayout = (
  notes: EmotionNote[],
  middles: EmotionNoteMiddle[],
  themeColor?: [number, number, number],
) => {
  const [elkNodes, setElkNodes] = useState<Node[]>([]);
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
      const outDegreeMap = buildOutDegreeMap(middles);
      const maxOutDegree = Math.max(1, ...outDegreeMap.values());
      const nodeIds = new Set(notes.map((note) => String(note.id)));
      const notesById = new Map(notes.map((note) => [String(note.id), note]));
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
      const flowLayoutSpec = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "mrtree",
          "elk.direction": "RIGHT",
          "elk.spacing.nodeNode": "320",
          "elk.spacing.edgeNode": "220",
          "elk.edgeRouting": "SPLINES",
        },
        children: elkNodesInput,
        edges: elkEdgesInput,
      };
      const result = await elk.layout(flowLayoutSpec);
      if (cancelled) {
        return;
      }
      let minX = Infinity;
      let minY = Infinity;
      const timeIndex = createTimeIndex(notes);
      const orderedChildren = (result.children ?? [])
        .filter(isPositionedElkNode)
        .slice()
        .sort((a, b) => a.x - b.x);
      const spreadOffsets = buildSpreadOffsets(orderedChildren);
      result.children?.forEach((child) => {
        if (!isPositionedElkNode(child)) return;
        minX = Math.min(minX, child.x);
        minY = Math.min(minY, child.y);
      });
      const offsetX = Number.isFinite(minX) ? minX : 0;
      const offsetY = Number.isFinite(minY) ? minY : 0;
      const padding = FLOW_PADDING;
      const activeTheme = themeColor ?? INDIGO;
      const edgeColor = `rgb(${activeTheme[0]}, ${activeTheme[1]}, ${activeTheme[2]})`;
      const nextNodes =
        result.children
          ?.map((child) => {
            if (!isPositionedElkNode(child)) return null;
            const note = notesById.get(child.id);
            if (!note) {
              return null;
            }
            const size = getNodeSize(note.id, outDegreeMap);
            const outDegree = outDegreeMap.get(note.id) ?? 0;
            const intensity =
              maxOutDegree > 0 ? Math.min(1, outDegree / maxOutDegree) : 0;
            const inverted = 1 - intensity;
            const fillRgb = mixColor(BASE_BLUE, activeTheme, inverted * 0.75);
            const borderRgb = mixColor(BORDER_BASE, activeTheme, inverted);
            const fill = toRgba(fillRgb, 0.45);
            const border = toRgba(borderRgb, 0.75);
            const titleText = note.title?.trim() || "감정 노트";
            const triggerText = note.trigger_text?.trim() || "트리거가 없습니다.";
            const labelText = note.title?.trim() || note.trigger_text?.trim() || "감정 노트";
            const dateText = formatFlowDate(note.created_at);
            const label = (
              <div className={styles.nodeLabel}>
                <span className={styles.nodeTitle}>{labelText}</span>
                <span className={styles.nodeMeta}>
                  #{note.id} {dateText ? `· ${dateText}` : ""}
                </span>
              </div>
            );
            const spreadY = spreadOffsets.get(child.id) ?? 0;
            const timeOffset = (timeIndex.get(child.id) ?? 0) * SLOPE_STEP;
            const position = {
              x: child.x - offsetX + padding,
              y: child.y - offsetY + padding + spreadY + timeOffset,
            };
            return {
              id: String(note.id),
              type: "emotion",
              position,
              data: { note, label, size, chips: [], titleText, triggerText },
              className: styles.node,
              style: {
                width: size,
                height: size,
                borderRadius: 999,
                zIndex: 2,
                background: fill,
                borderColor: border,
                color: "#eef2ff",
              },
            } as Node;
          })
          .filter((node): node is Node => node !== null) ?? [];

      const nextAxisLabels = nextNodes
        .map((node) => {
          const note = notesById.get(node.id);
          if (!note) return null;
          const dateText = formatFlowDate(note.created_at);
          if (!dateText) return null;
          const width = Number(node.style?.width ?? 0) || 0;
          return {
            id: node.id,
            x: node.position.x + width / 2,
            label: dateText,
          };
        })
        .filter(
          (item): item is { id: string; x: number; label: string } =>
            item !== null,
        );
      const maxY = nextNodes.reduce((acc, node) => {
        const height = Number(node.style?.height ?? 0) || 0;
        return Math.max(acc, node.position.y + height);
      }, 0);
      const nextAxisY =
        Number.isFinite(maxY) && Number.isFinite(minY) && nextNodes.length > 0
          ? Math.max(minY + 24, maxY - 12)
          : null;

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
      }) as Edge[];

      setElkNodes(nextNodes);
      setElkEdges(nextEdges);
      setAxisLabels(nextAxisLabels);
      setAxisY(nextAxisY);
    };
    layout();
    return () => {
      cancelled = true;
    };
  }, [middles, notes, themeColor]);

  return { elkNodes, elkEdges, axisLabels, axisY };
};
