"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactFlowInstance } from "reactflow";

export const useFlowDetailViewport = () => {
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const pendingViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(
    null,
  );
  const rafRef = useRef<number | null>(null);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
    setViewport(instance.getViewport());
  }, []);

  const handleMove = useCallback(
    (_: unknown, nextViewport: { x: number; y: number; zoom: number }) => {
      pendingViewportRef.current = nextViewport;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingViewportRef.current;
        if (!pending) return;

        setViewport((prev) => {
          const moved =
            Math.abs(prev.x - pending.x) > 0.25 ||
            Math.abs(prev.y - pending.y) > 0.25 ||
            Math.abs(prev.zoom - pending.zoom) > 0.0008;
          return moved ? pending : prev;
        });
      });
    },
    [],
  );

  const syncViewport = useCallback(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    setViewport(instance.getViewport());
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  return {
    instanceRef,
    viewport,
    handleInit,
    handleMove,
    syncViewport,
  };
};
