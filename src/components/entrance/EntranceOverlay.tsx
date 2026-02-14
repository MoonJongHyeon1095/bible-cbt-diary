"use client";

import { useFlowDetailDisplay } from "@/components/flow/detail/hooks/useFlowDetailDisplay";
import { useFlowDetailLayout } from "@/components/flow/detail/hooks/useFlowDetailLayout";
import { getFlowThemeColor } from "@/components/flow/utils/flowColors";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { Edge } from "reactflow";
import {
  ENTRANCE_SAMPLE_MIDDLES,
  ENTRANCE_SAMPLE_NOTES,
} from "./data/entranceSampleFlow";
import styles from "./EntranceOverlay.module.css";
import { SCENE_1 } from "./scenes";
import EntranceFlowScene from "./scenes/components/EntranceFlowScene";
import EntranceIntroScene from "./scenes/components/EntranceIntroScene";
import EntranceScene2 from "./scenes/components/EntranceScene2";
import Scene2_1 from "./scenes/Scene2-1";

type EntranceOverlayProps = {
  onComplete: () => void;
};

const INTRO_SUBTEXT = `
If we were drawn as a flow graph—
the self within the self within the self,
the one on this side…
and the self beyond me… (ugh)`;
const SCENE_ADVANCE_LOCK_MS = 300;
const SCENE_1_1_MIN_STAY_MS = 900;

const formatEntranceDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

export default function EntranceOverlay({ onComplete }: EntranceOverlayProps) {
  const [sequenceStep, setSequenceStep] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const transitionLockUntilRef = useRef(0);
  const sceneEnteredAtRef = useRef(Date.now());

  const scene = SCENE_1[sceneIndex] ?? SCENE_1[0];
  const themeColor = useMemo(() => getFlowThemeColor(10).rgb, []);
  const entranceDateTextById = useMemo(
    () =>
      new Map(
        ENTRANCE_SAMPLE_NOTES.map((note) => [
          String(note.id),
          formatEntranceDate(note.created_at),
        ]),
      ),
    [],
  );

  const { elkNodes, elkEdges } = useFlowDetailLayout(
    ENTRANCE_SAMPLE_NOTES,
    ENTRANCE_SAMPLE_MIDDLES,
    themeColor,
  );

  const { displayNodes: baseNodes, displayEdges: baseEdges } =
    useFlowDetailDisplay(elkNodes, elkEdges, scene.selectedNodeId);

  const visibleSet = useMemo(
    () => new Set(scene.visibleNodeIds),
    [scene.visibleNodeIds],
  );

  const displayNodes = useMemo(() => {
    return baseNodes
      .filter((node) => visibleSet.has(node.id))
      .map((node) => {
        const highlighted = scene.highlightNodeId === node.id;
        const shouldDim = Boolean(scene.highlightNodeId) && !highlighted;
        return {
          ...node,
          data: {
            ...node.data,
            showNoteId: false,
            emphasizeDate: true,
            dateText: entranceDateTextById.get(node.id) ?? node.data.dateText,
          },
          style: {
            ...node.style,
            opacity: shouldDim ? 0.22 : 1,
            borderWidth: highlighted ? 2.6 : 1,
            borderColor: highlighted ? "#a9c2e6" : node.style?.borderColor,
            boxShadow: highlighted
              ? "0 0 0 6px rgba(135, 166, 214, 0.28), 0 16px 30px rgba(5,10,18,0.35)"
              : "none",
            zIndex: highlighted ? 6 : 2,
          },
        };
      });
  }, [baseNodes, entranceDateTextById, scene.highlightNodeId, visibleSet]);

  const displayEdges = useMemo(() => {
    const visible = (baseEdges as Edge[]).filter(
      (edge) =>
        visibleSet.has(String(edge.source)) &&
        visibleSet.has(String(edge.target)),
    );
    if (!scene.highlightNodeId) return visible;
    return visible.map((edge) => {
      const related =
        String(edge.source) === scene.highlightNodeId ||
        String(edge.target) === scene.highlightNodeId;
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: related ? 1 : 0.16,
          strokeWidth: related ? 3 : edge.style?.strokeWidth,
        },
      };
    });
  }, [baseEdges, scene.highlightNodeId, visibleSet]);

  const canAdvanceByClick = sequenceStep === 0 || !scene.showGoDeeper;
  const scene2Lines = useMemo(
    () =>
      Scene2_1.narration
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [],
  );
  const scene2Actions = Scene2_1.actions;

  useEffect(() => {
    sceneEnteredAtRef.current = Date.now();
  }, [sceneIndex, sequenceStep]);

  const handlePointerDownCapture = (event: PointerEvent<HTMLDivElement>) => {
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMoveCapture = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerDownRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 6) {
      suppressNextClickRef.current = true;
    }
  };

  const handlePointerUpCapture = () => {
    pointerDownRef.current = null;
  };

  const handleSceneAdvanceClick = (event: MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    const now = Date.now();
    if (now < transitionLockUntilRef.current) return;
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, textarea, select, [data-entrance-block-advance]",
      )
    ) {
      return;
    }
    if (sequenceStep === 0) {
      transitionLockUntilRef.current = now + SCENE_ADVANCE_LOCK_MS;
      setSequenceStep(1);
      return;
    }
    if (sceneIndex >= SCENE_1.length) return;
    if (!canAdvanceByClick) return;
    if (
      sceneIndex === 0 &&
      now - sceneEnteredAtRef.current < SCENE_1_1_MIN_STAY_MS
    ) {
      return;
    }
    transitionLockUntilRef.current = now + SCENE_ADVANCE_LOCK_MS;
    setSceneIndex((prev) => Math.min(SCENE_1.length - 1, prev + 1));
  };

  return (
    <div
      className={styles.overlay}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onClickCapture={handleSceneAdvanceClick}
    >
      {sequenceStep === 0 ? (
        <EntranceIntroScene title="Flow Entrance" subtext={INTRO_SUBTEXT} />
      ) : sceneIndex < SCENE_1.length ? (
        <EntranceFlowScene
          scene={scene}
          nodes={displayNodes}
          edges={displayEdges}
          onGoDeeper={() => setSceneIndex(SCENE_1.length)}
        />
      ) : null}

      {sequenceStep > 0 && sceneIndex >= SCENE_1.length ? (
        <EntranceScene2
          lines={scene2Lines}
          skipLabel={scene2Actions.skipLabel}
          continueLabel={scene2Actions.continueLabel}
          onSkip={onComplete}
          onContinue={onComplete}
        />
      ) : null}
    </div>
  );
}
