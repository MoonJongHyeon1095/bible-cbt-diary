"use client";

import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EmotionNoteGraphGroupList.module.css";
import { fetchEmotionNoteGraphGroups } from "./utils/emotionNoteGraphApi";
import { getGroupThemeColor } from "./utils/graphColors";

type EmotionNoteGraphGroupListProps = {
  accessToken: string;
};

type GroupNode = {
  id: number;
  noteCount: number;
  radius: number;
  color: string;
  rgb: [number, number, number];
  x: number;
  y: number;
};

const buildNodes = (groups: { id: number; note_count: number }[]) =>
  groups.map((group) => {
    const radius = 36 + Math.min(90, group.note_count * 6);
    const theme = getGroupThemeColor(group.id);
    return {
      id: group.id,
      noteCount: group.note_count,
      radius,
      color: theme.rgbString,
      rgb: theme.rgb,
      x: 0,
      y: 0,
    };
  });

export default function EmotionNoteGraphGroupList({
  accessToken,
}: EmotionNoteGraphGroupListProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<GroupNode[]>([]);
  const [nodes, setNodes] = useState<GroupNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { response, data } = await fetchEmotionNoteGraphGroups(accessToken);
      if (!response.ok) {
        setNodes([]);
        setIsLoading(false);
        return;
      }
      setNodes(buildNodes(data.groups));
      setIsLoading(false);
    };
    load();
  }, [accessToken]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (nodes.length === 0 || size.width === 0 || size.height === 0) {
      return;
    }
    const simNodes = nodesRef.current.map((node) => ({ ...node }));
    const simulation = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-8))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force(
        "collide",
        forceCollide().radius((node) => (node as GroupNode).radius * 0.92),
      )
      .alpha(0.9);

    let rafId: number | null = null;
    const tick = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        setNodes(simNodes.map((node) => ({ ...node })));
        rafId = null;
      });
    };
    simulation.on("tick", tick);

    return () => {
      simulation.stop();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [nodes.length, size.height, size.width]);

  const totalCount = useMemo(
    () => nodes.reduce((sum, node) => sum + node.noteCount, 0),
    [nodes],
  );

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <p className={styles.label}>감정 그래프</p>
          <h2 className={styles.title}>
            {nodes.length}개의 그룹, {totalCount}개의 기록
          </h2>
        </div>
      </header>

      <div ref={containerRef} className={styles.canvas}>
        {isLoading ? (
          <div className={styles.placeholder}>그룹을 불러오는 중...</div>
        ) : nodes.length === 0 ? (
          <div className={styles.placeholder}>아직 그룹이 없습니다.</div>
        ) : (
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={styles.node}
              style={
                {
                  width: node.radius * 2,
                  height: node.radius * 2,
                  backgroundColor: node.color,
                  "--tx": `${node.x - node.radius}px`,
                  "--ty": `${node.y - node.radius}px`,
                  "--node-r": node.rgb[0],
                  "--node-g": node.rgb[1],
                  "--node-b": node.rgb[2],
                } as CSSProperties
              }
              onClick={() => router.push(`/graph?groupId=${node.id}`)}
            >
              <span className={styles.nodeText}>
                <span className={styles.nodeCount}>{node.noteCount}</span>
                <span className={styles.nodeUnit}>개의</span>
              </span>
              <span className={styles.nodeLabel}>기록이 있습니다</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
