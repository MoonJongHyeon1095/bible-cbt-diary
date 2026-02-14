import type {
  EmotionNote,
  EmotionNoteMiddle,
} from "@/lib/types/emotionNoteTypes";
import type { ElkNode } from "elkjs/lib/elk-api";
import type { Edge, Node } from "reactflow";
import type { FlowDetailNodeData } from "../../nodes/FlowDetailNode";
import { buildFlowEdges } from "./buildFlowEdges";
import { buildFlowNodes } from "./buildFlowNodes";

const SPREAD_STEP = 140;
const DATE_JITTER_STEP = 160;
const INDIGO: [number, number, number] = [79, 70, 229];

type PositionedElkNode = ElkNode & { x: number; y: number };

type BuildFlowLayoutParams = {
  notes: EmotionNote[];
  middles: EmotionNoteMiddle[];
  elkChildren: ElkNode[];
  themeColor?: [number, number, number];
};

type BuildFlowLayoutResult = {
  nodes: Node<FlowDetailNodeData>[];
  edges: Edge[];
  axisLabels: { id: string; x: number; label: string }[];
  axisY: number | null;
};

const buildOutDegreeMap = (middles: EmotionNoteMiddle[]) => {
  const map = new Map<number, number>();
  middles.forEach((middle) => {
    const count = map.get(middle.from_note_id) ?? 0;
    map.set(middle.from_note_id, count + 1);
  });
  return map;
};

const formatFlowDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

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

const isPositionedElkNode = (node: ElkNode): node is PositionedElkNode =>
  Number.isFinite(node.x) && Number.isFinite(node.y);

export const buildFlowLayout = ({
  notes,
  middles,
  elkChildren,
  themeColor,
}: BuildFlowLayoutParams): BuildFlowLayoutResult => {
  if (notes.length === 0) {
    return { nodes: [], edges: [], axisLabels: [], axisY: null };
  }

  const outDegreeMap = buildOutDegreeMap(middles);
  const maxOutDegree = Math.max(1, ...outDegreeMap.values());
  const nodeIds = new Set(notes.map((note) => String(note.id)));
  const connectedNodeIds = new Set<string>();
  middles.forEach((middle) => {
    connectedNodeIds.add(String(middle.from_note_id));
    connectedNodeIds.add(String(middle.to_note_id));
  });

  const notesById = new Map(notes.map((note) => [String(note.id), note]));
  let minX = Infinity;
  let minY = Infinity;
  const timeIndex = createTimeIndex(notes);

  const orderedChildren = elkChildren
    .filter(isPositionedElkNode)
    .slice()
    .sort((a, b) => a.x - b.x);

  const spreadOffsets = buildSpreadOffsets(orderedChildren);

  elkChildren.forEach((child) => {
    if (!isPositionedElkNode(child)) return;
    minX = Math.min(minX, child.x);
    minY = Math.min(minY, child.y);
  });

  const offsetX = Number.isFinite(minX) ? minX : 0;
  const offsetY = Number.isFinite(minY) ? minY : 0;
  const activeTheme = themeColor ?? INDIGO;
  const edgeColor = `rgb(${activeTheme[0]}, ${activeTheme[1]}, ${activeTheme[2]})`;
  const nodes = buildFlowNodes({
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
  });

  const filteredMiddles = middles.filter(
    (middle) =>
      nodeIds.has(String(middle.from_note_id)) &&
      nodeIds.has(String(middle.to_note_id)),
  );

  const adjacency = new Map<string, Set<string>>();
  filteredMiddles.forEach((middle) => {
    const fromId = String(middle.from_note_id);
    const toId = String(middle.to_note_id);
    if (!adjacency.has(fromId)) adjacency.set(fromId, new Set());
    if (!adjacency.has(toId)) adjacency.set(toId, new Set());
    adjacency.get(fromId)?.add(toId);
    adjacency.get(toId)?.add(fromId);
  });

  nodes.forEach((node) => {
    if (!adjacency.has(node.id)) {
      adjacency.set(node.id, new Set());
    }
  });

  const componentMap = new Map<string, string>();
  let componentIndex = 0;
  const stack: string[] = [];
  const visit = (startId: string) => {
    const componentId = `component-${componentIndex++}`;
    stack.push(startId);
    componentMap.set(startId, componentId);
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;
      neighbors.forEach((neighbor) => {
        if (!componentMap.has(neighbor)) {
          componentMap.set(neighbor, componentId);
          stack.push(neighbor);
        }
      });
    }
  };

  nodes.forEach((node) => {
    if (!componentMap.has(node.id)) {
      visit(node.id);
    }
  });

  const nodesByComponent = new Map<string, Node<FlowDetailNodeData>[]>();
  nodes.forEach((node) => {
    const componentId = componentMap.get(node.id) ?? "component-unknown";
    const group = nodesByComponent.get(componentId) ?? [];
    group.push(node);
    nodesByComponent.set(componentId, group);
  });

  const alignedNodes = nodes.map((node) => ({ ...node }));
  const nodeIndexById = new Map(alignedNodes.map((node, index) => [node.id, index]));

  nodesByComponent.forEach((group) => {
    if (group.length < 2) return;

    const createdBuckets = new Map<string, string[]>();
    const createdOrder = group
      .slice()
      .sort((a, b) => {
        const aNote = notesById.get(a.id);
        const bNote = notesById.get(b.id);
        if (!aNote || !bNote) return 0;
        return aNote.created_at.localeCompare(bNote.created_at) || aNote.id - bNote.id;
      })
      .map((node) => {
        const note = notesById.get(node.id);
        const dateKey = note?.created_at?.slice(0, 10) ?? "unknown";
        const bucket = createdBuckets.get(dateKey) ?? [];
        bucket.push(node.id);
        createdBuckets.set(dateKey, bucket);
        return node.id;
      });

    const xPositions = group
      .slice()
      .sort((a, b) => a.position.x - b.position.x)
      .map((node) => node.position.x);

    createdOrder.forEach((id, index) => {
      const nodeIndex = nodeIndexById.get(id);
      if (nodeIndex === undefined) return;
      const targetX = xPositions[index];
      if (!Number.isFinite(targetX)) return;

      const note = notesById.get(id);
      const dateKey = note?.created_at?.slice(0, 10) ?? "unknown";
      const bucket = createdBuckets.get(dateKey) ?? [];
      const bucketIndex = bucket.indexOf(id);
      const bucketOffset =
        bucketIndex >= 0 ? bucketIndex - (bucket.length - 1) / 2 : 0;
      const jitterX = bucketOffset * DATE_JITTER_STEP;

      alignedNodes[nodeIndex] = {
        ...alignedNodes[nodeIndex],
        position: {
          ...alignedNodes[nodeIndex].position,
          x: targetX + jitterX,
        },
      };
    });
  });

  const axisLabels = alignedNodes
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
    .filter((item): item is { id: string; x: number; label: string } => item !== null);

  const maxY = alignedNodes.reduce((acc, node) => {
    const height = Number(node.style?.height ?? 0) || 0;
    return Math.max(acc, node.position.y + height);
  }, 0);

  const axisY =
    Number.isFinite(maxY) && Number.isFinite(minY) && alignedNodes.length > 0
      ? Math.max(minY + 24, maxY + 32)
      : null;

  const edges = buildFlowEdges(filteredMiddles, edgeColor);

  return { nodes: alignedNodes, edges, axisLabels, axisY };
};
