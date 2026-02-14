"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactFlowInstance } from "reactflow";

export const useFlowDetailViewport = () => {
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
    setViewport(instance.getViewport());
  }, []);

  const handleMove = useCallback(
    (_: unknown, nextViewport: { x: number; y: number; zoom: number }) => {
      setViewport(nextViewport);
    },
    [],
  );

  return {
    instanceRef,
    viewport,
    handleInit,
    handleMove,
  };
};
