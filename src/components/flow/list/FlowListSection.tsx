"use client";

import { useModalOpen } from "@/components/common/useModalOpen";
import { useCbtToast } from "@/components/session/common/CbtToast";
import { deleteEmotionFlow } from "@/lib/api/flow/deleteEmotionFlow";
import { fetchEmotionNote } from "@/lib/api/emotion-notes/getEmotionNote";
import { patchEmotionNoteFlowMeta } from "@/lib/api/flow/patchEmotionNoteFlowMeta";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flowRoutes } from "../domain/navigation/flowRoutes";
import { invalidateFlowListQueries } from "../domain/query/flowQueryClient";
import { useFlowListQuery } from "./hooks/useFlowListQuery";
import { getFlowThemeColor } from "../utils/flowColors";
import FlowListSectionView from "./views/FlowListSectionView";
import styles from "./FlowListSection.module.css";

const META_TITLE_PLACEHOLDER = "플로우 제목";
const META_DESCRIPTION_PLACEHOLDER = "플로우 설명";
const INVALID_META_TITLE_VALUES = new Set([
  "",
  META_TITLE_PLACEHOLDER,
  "제목을 입력해주세요",
  "제목 없는 플로우",
]);
const INVALID_META_DESCRIPTION_VALUES = new Set([
  "",
  META_DESCRIPTION_PLACEHOLDER,
  "설명을 입력해주세요",
  "설명이 아직 없습니다.",
]);

const normalizeMetaTitle = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  return INVALID_META_TITLE_VALUES.has(text) ? "" : text;
};

const normalizeMetaDescription = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  return INVALID_META_DESCRIPTION_VALUES.has(text) ? "" : text;
};

type FlowListSectionProps = {
  access: AccessContext;
  noteId?: number | null;
};

type GroupNode = {
  id: number;
  noteCount: number;
  title: string;
  description: string | null;
  radius: number;
  color: string;
  rgb: [number, number, number];
  x: number;
  y: number;
};

const buildNodes = (
  flows: {
    id: number;
    note_count: number;
    title: string;
    description: string | null;
  }[],
) => {
  const minRadius = 36 + Math.min(90, 2 * 6);
  return flows.map((flow) => {
    const radius = Math.max(minRadius, 36 + Math.min(90, flow.note_count * 6));
    const theme = getFlowThemeColor(flow.id);
    return {
      id: flow.id,
      noteCount: flow.note_count,
      title: flow.title ?? "",
      description: flow.description ?? null,
      radius,
      color: theme.rgbString,
      rgb: theme.rgb,
      x: 0,
      y: 0,
    };
  });
};

const seedNodes = (
  flows: {
    id: number;
    note_count: number;
    title: string;
    description: string | null;
  }[],
  prevNodes: GroupNode[],
  size: { width: number; height: number },
) => {
  const seeded = buildNodes(flows);
  const prevById = new Map(prevNodes.map((node) => [node.id, node]));
  const width = size.width || 320;
  const height = size.height || 520;
  const centerX = width / 2;
  const centerY = height / 2;
  const jitter = Math.min(80, Math.max(30, Math.min(width, height) * 0.12));

  return seeded.map((node) => {
    const prev = prevById.get(node.id);
    if (prev) {
      return { ...node, x: prev.x, y: prev.y };
    }
    return {
      ...node,
      x: centerX + (Math.random() - 0.5) * jitter,
      y: centerY + (Math.random() - 0.5) * jitter,
    };
  });
};

const layoutNodesInRings = (
  sourceNodes: GroupNode[],
  size: { width: number; height: number },
) => {
  if (sourceNodes.length === 0) {
    return [];
  }

  const centerX = (size.width || 320) / 2;
  const centerY = (size.height || 520) / 2;
  const sortedNodes = [...sourceNodes].sort((a, b) => b.noteCount - a.noteCount);
  const minGap = 18;
  const baseRadius = 56;
  const ringStep = 84;
  let ringIndex = 0;
  let nodeIndex = 0;
  const positioned: GroupNode[] = [];

  while (nodeIndex < sortedNodes.length) {
    const ringRadius = baseRadius + ringIndex * ringStep;
    const circumference = Math.max(1, 2 * Math.PI * ringRadius);
    const capacity = Math.max(
      6,
      Math.floor(
        circumference / (Math.max(58, sortedNodes[nodeIndex]?.radius ?? 58) + minGap),
      ),
    );
    const count = Math.min(capacity, sortedNodes.length - nodeIndex);

    for (let slot = 0; slot < count; slot += 1) {
      const angle = (Math.PI * 2 * slot) / count + ringIndex * 0.35;
      const original = sortedNodes[nodeIndex + slot];
      positioned.push({
        ...original,
        x: centerX + Math.cos(angle) * ringRadius,
        y: centerY + Math.sin(angle) * ringRadius,
      });
    }

    nodeIndex += count;
    ringIndex += 1;
  }

  return positioned;
};

export default function FlowListSection({
  access,
  noteId = null,
}: FlowListSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pushToast } = useCbtToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasLayerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<GroupNode[]>([]);
  const panStateRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const panRafRef = useRef<number | null>(null);
  const pendingPanRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });

  const [nodes, setNodes] = useState<GroupNode[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isLowPerfMode, setIsLowPerfMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMetaEditing, setIsMetaEditing] = useState(false);
  const [metaTitleDraft, setMetaTitleDraft] = useState("");
  const [metaDescriptionDraft, setMetaDescriptionDraft] = useState("");
  const [isMetaSaving, setIsMetaSaving] = useState(false);

  useModalOpen(confirmDelete);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(
    () => () => {
      if (panRafRef.current !== null) {
        cancelAnimationFrame(panRafRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userAgent = window.navigator.userAgent || "";
    const hasTouchOnMac =
      userAgent.includes("Macintosh") &&
      typeof document !== "undefined" &&
      "ontouchend" in document;
    const isIOSDevice = /iPad|iPhone|iPod/i.test(userAgent) || hasTouchOnMac;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setIsLowPerfMode(isIOSDevice || prefersReducedMotion);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        setSize((prev) =>
          Math.abs(prev.width - width) < 8 && Math.abs(prev.height - height) < 8
            ? prev
            : { width, height },
        );
        rafId = null;
      });
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const flowsQuery = useFlowListQuery(access, noteId);
  const isLoading = flowsQuery.isPending;
  const flows = useMemo(() => flowsQuery.data ?? [], [flowsQuery.data]);
  const filterNoteQuery = useQuery({
    queryKey:
      noteId && access.mode !== "blocked"
        ? queryKeys.emotionNotes.detail(access, noteId)
        : ["flow-note-filter", "noop"],
    queryFn: async () => {
      if (!noteId) return null;
      const { response, data } = await fetchEmotionNote(noteId, access);
      if (!response.ok) {
        throw new Error("note filter context fetch failed");
      }
      return data.note;
    },
    enabled: Boolean(noteId) && access.mode !== "blocked",
    staleTime: 60_000,
  });
  const filterNoteTitle = useMemo(
    () => filterNoteQuery.data?.title?.trim() || null,
    [filterNoteQuery.data?.title],
  );

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) ?? null,
    [flows, selectedFlowId],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedFlowId) ?? null,
    [nodes, selectedFlowId],
  );

  useEffect(() => {
    if (flowsQuery.isError) {
      setNodes([]);
      return;
    }
    setNodes((prev) => seedNodes(flows, prev, size));
  }, [flows, flowsQuery.isError, size]);

  useEffect(() => {
    if (selectedFlowId && !flows.some((flow) => flow.id === selectedFlowId)) {
      setSelectedFlowId(null);
    }
  }, [flows, selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId) {
      setConfirmDelete(false);
      setIsMetaEditing(false);
      setMetaTitleDraft("");
      setMetaDescriptionDraft("");
    }
  }, [selectedFlowId]);

  useEffect(() => {
    if (!selectedFlow || isMetaEditing) {
      return;
    }
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow.description));
  }, [isMetaEditing, selectedFlow]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const width = size.width;
    const height = size.height;
    if (nodes.length === 0 || width === 0 || height === 0) {
      return;
    }

    if (isLowPerfMode && nodes.length > 36) {
      setNodes(layoutNodesInRings(nodesRef.current, { width, height }));
      return;
    }

    const simNodes = nodesRef.current.map((node) => ({ ...node }));
    const simulation = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(isLowPerfMode ? -6 : -8))
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collide",
        forceCollide().radius((node) => (node as GroupNode).radius * 0.92),
      )
      .alpha(isLowPerfMode ? 0.7 : 0.9)
      .alphaMin(isLowPerfMode ? 0.1 : 0.06)
      .alphaDecay(isLowPerfMode ? 0.2 : 0.12);
    simulation.stop();
    const tickCount = Math.min(
      isLowPerfMode ? 56 : 120,
      Math.max(
        isLowPerfMode ? 16 : 42,
        Math.round((isLowPerfMode ? 700 : 1600) / Math.max(simNodes.length, 6)),
      ),
    );
    for (let index = 0; index < tickCount; index += 1) {
      simulation.tick();
    }
    setNodes(simNodes.map((node) => ({ ...node })));

    return () => {
      simulation.stop();
    };
  }, [isLowPerfMode, nodes.length, size.height, size.width]);

  const totalCount = useMemo(
    () => nodes.reduce((sum, node) => sum + node.noteCount, 0),
    [nodes],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement).closest(`.${styles.node}`) ||
      (event.target as HTMLElement).closest(`.${styles.nodeTooltip}`)
    ) {
      return;
    }
    setSelectedFlowId(null);
    panStateRef.current.isPanning = true;
    setIsPanning(true);
    panStateRef.current.startX = event.clientX;
    panStateRef.current.startY = event.clientY;
    panStateRef.current.originX = panRef.current.x;
    panStateRef.current.originY = panRef.current.y;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current.isPanning) return;
    const dx = event.clientX - panStateRef.current.startX;
    const dy = event.clientY - panStateRef.current.startY;
    pendingPanRef.current = {
      x: panStateRef.current.originX + dx,
      y: panStateRef.current.originY + dy,
    };
    if (panRafRef.current !== null) return;
    panRafRef.current = requestAnimationFrame(() => {
      panRafRef.current = null;
      const next = pendingPanRef.current;
      panRef.current = next;
      if (canvasLayerRef.current) {
        canvasLayerRef.current.style.setProperty("--pan-x", `${next.x}px`);
        canvasLayerRef.current.style.setProperty("--pan-y", `${next.y}px`);
      }
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panStateRef.current.isPanning) return;
    panStateRef.current.isPanning = false;
    setIsPanning(false);
    if (panRafRef.current !== null) {
      cancelAnimationFrame(panRafRef.current);
      panRafRef.current = null;
    }
    setPan(pendingPanRef.current);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleCanvasWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  const handleDeleteFlow = async () => {
    if (!selectedFlowId) return;
    setIsDeleting(true);
    const { response, data } = await deleteEmotionFlow(access, {
      flow_id: selectedFlowId,
    });

    if (!response.ok || !data.ok) {
      setIsDeleting(false);
      pushToast(data.message ?? "플로우를 삭제하지 못했습니다.", "error");
      return;
    }

    await invalidateFlowListQueries(queryClient, access);
    setConfirmDelete(false);
    setSelectedFlowId(null);
    setIsDeleting(false);
    pushToast("플로우를 삭제했습니다.", "success");
  };

  const handleStartMetaEdit = () => {
    if (!selectedFlow) return;
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow.description));
    setIsMetaEditing(true);
  };

  const handleCancelMetaEdit = () => {
    setMetaTitleDraft(normalizeMetaTitle(selectedFlow?.title));
    setMetaDescriptionDraft(normalizeMetaDescription(selectedFlow?.description));
    setIsMetaEditing(false);
  };

  const handleSaveMeta = async () => {
    if (!selectedFlowId) return;
    if (access.mode === "blocked") {
      pushToast("플로우를 수정할 수 없습니다.", "error");
      return;
    }

    const nextTitle = normalizeMetaTitle(metaTitleDraft).slice(0, 40);
    const nextDescription = normalizeMetaDescription(metaDescriptionDraft).slice(
      0,
      40,
    );
    if (!nextTitle) {
      pushToast("플로우 제목을 입력해주세요.", "error");
      return;
    }

    setIsMetaSaving(true);
    const { response, data } = await patchEmotionNoteFlowMeta(access, {
      flow_id: selectedFlowId,
      title: nextTitle,
      description: nextDescription.length > 0 ? nextDescription : null,
    });

    if (!response.ok || !data.ok) {
      setIsMetaSaving(false);
      pushToast(data.message ?? "플로우 정보를 저장하지 못했습니다.", "error");
      return;
    }

    await invalidateFlowListQueries(queryClient, access);
    setIsMetaEditing(false);
    setIsMetaSaving(false);
    pushToast("플로우 정보를 저장했습니다.", "success");
  };

  return (
    <FlowListSectionView
      containerRef={containerRef}
      canvasLayerRef={canvasLayerRef}
      isPanning={isPanning}
      isLowPerfMode={isLowPerfMode}
      isLoading={isLoading}
      nodes={nodes}
      pan={pan}
      selectedFlowId={selectedFlowId}
      selectedFlow={selectedFlow}
      selectedNode={selectedNode}
      totalCount={totalCount}
      confirmDelete={confirmDelete}
      isDeleting={isDeleting}
      isMetaEditing={isMetaEditing}
      isMetaSaving={isMetaSaving}
      metaTitleDraft={metaTitleDraft}
      metaDescriptionDraft={metaDescriptionDraft}
      onCanvasPointerDown={handlePointerDown}
      onCanvasPointerMove={handlePointerMove}
      onCanvasPointerUp={handlePointerUp}
      onCanvasWheel={handleCanvasWheel}
      onSelectFlow={setSelectedFlowId}
      filterNoteId={noteId}
      filterNoteTitle={filterNoteTitle}
      isFilterNoteLoading={filterNoteQuery.isPending || filterNoteQuery.isFetching}
      onStartMetaEdit={handleStartMetaEdit}
      onCancelMetaEdit={handleCancelMetaEdit}
      onSaveMeta={handleSaveMeta}
      onChangeMetaTitle={(value) => setMetaTitleDraft(value.slice(0, 40))}
      onChangeMetaDescription={(value) =>
        setMetaDescriptionDraft(value.slice(0, 40))
      }
      onOpenDeleteConfirm={() => setConfirmDelete(true)}
      onCloseDeleteConfirm={() => setConfirmDelete(false)}
      onDeleteFlow={handleDeleteFlow}
      onOpenFlow={(selectedId) => router.push(flowRoutes.byFlow(selectedId))}
    />
  );
}
