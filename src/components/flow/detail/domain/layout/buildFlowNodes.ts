import type { EmotionNote } from "@/lib/types/emotionNoteTypes";
import type { ElkNode } from "elkjs/lib/elk-api";
import type { Node } from "reactflow";
import type { FlowDetailNodeData } from "../../nodes/FlowDetailNode";

const BASE_NODE_SIZE = 130;
const NODE_SIZE_STEP = 14;
const NODE_SIZE_MAX_EXTRA = 120;
const SLOPE_STEP = 90;
const TIME_AXIS_STEP = 320;
const FLOW_PADDING = 12;
const INDIGO: [number, number, number] = [79, 70, 229];
const BASE_BLUE: [number, number, number] = [230, 232, 246];
const BORDER_BASE: [number, number, number] = [150, 160, 214];

type PositionedElkNode = ElkNode & { x: number; y: number };

type BuildFlowNodesParams = {
  elkChildren: ElkNode[];
  notesById: Map<string, EmotionNote>;
  outDegreeMap: Map<number, number>;
  maxOutDegree: number;
  timeIndex: Map<string, number>;
  connectedNodeIds: Set<string>;
  spreadOffsets: Map<string, number>;
  offsetX: number;
  offsetY: number;
  themeColor?: [number, number, number];
};

const isPositionedElkNode = (node: ElkNode): node is PositionedElkNode =>
  Number.isFinite(node.x) && Number.isFinite(node.y);

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

const toRgba = (rgb: string, alpha: number) =>
  rgb.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);

const formatFlowDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

export const buildFlowNodes = ({
  elkChildren,
  notesById,
  outDegreeMap,
  maxOutDegree,
  timeIndex,
  connectedNodeIds,
  spreadOffsets,
  offsetX,
  offsetY,
  themeColor,
}: BuildFlowNodesParams): Node<FlowDetailNodeData>[] => {
  const activeTheme = themeColor ?? INDIGO;
  const nodes: Node<FlowDetailNodeData>[] = [];

  elkChildren.forEach((child) => {
    if (!isPositionedElkNode(child)) return;
    const note = notesById.get(child.id);
    if (!note) return;

    const size = getNodeSize(note.id, outDegreeMap);
    const outDegree = outDegreeMap.get(note.id) ?? 0;
    const intensity = maxOutDegree > 0 ? Math.min(1, outDegree / maxOutDegree) : 0;
    const inverted = 1 - intensity;
    const fillRgb = mixColor(BASE_BLUE, activeTheme, inverted * 0.75);
    const borderRgb = mixColor(BORDER_BASE, activeTheme, inverted);
    const fill = toRgba(fillRgb, 1);
    const border = toRgba(borderRgb, 0.9);
    const titleText = note.title?.trim() || "감정 노트";
    const triggerText = note.trigger_text?.trim() || "트리거가 없습니다.";
    const labelText = note.title?.trim() || note.trigger_text?.trim() || "감정 노트";
    const dateText = formatFlowDate(note.created_at);
    const spreadY = spreadOffsets.get(child.id) ?? 0;
    const timeOffset = (timeIndex.get(child.id) ?? 0) * SLOPE_STEP;
    const isIsolated = !connectedNodeIds.has(child.id);
    const timeX = (timeIndex.get(child.id) ?? 0) * TIME_AXIS_STEP;

    const node: Node<FlowDetailNodeData> = {
      id: String(note.id),
      type: "emotion",
      position: {
        x: (isIsolated ? timeX : child.x - offsetX) + FLOW_PADDING,
        y: child.y - offsetY + FLOW_PADDING + spreadY + timeOffset,
      },
      data: {
        note,
        size,
        chips: [],
        titleText,
        triggerText,
        labelText,
        dateText,
      },
      style: {
        width: size,
        height: size,
        borderRadius: 999,
        zIndex: 2,
        background: fill,
        borderColor: border,
        color: "#eef2ff",
      },
    };

    nodes.push(node);
  });

  return nodes;
};
