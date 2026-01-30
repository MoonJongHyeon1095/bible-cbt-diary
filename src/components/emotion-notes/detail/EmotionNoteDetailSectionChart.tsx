"use client";

import { useEffect, useRef, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import styles from "./EmotionNoteDetailPage.module.css";

type SectionKey = "thought" | "error" | "alternative" | "behavior";

type SectionConfig = {
  key: SectionKey;
  label: string;
  color: string;
  count: number;
};

type EmotionNoteDetailSectionChartProps = {
  sections: SectionConfig[];
  selectedKey: SectionKey | null;
  onSelect: (key: SectionKey) => void;
};

type ChartDatum = {
  key: SectionKey;
  label: string;
  count: number;
  value: number;
  color: string;
};

const MIN_VALUE = 1;

const renderLabel = (props: PieLabelRenderProps) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0 } =
    props;
  const payload = props.payload as ChartDatum | undefined;
  if (!payload) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const angle = (-midAngle * Math.PI) / 180;
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className={styles.chartLabel}
    >
      <tspan x={x} dy="-0.1em">
        {payload.label}
      </tspan>
      <tspan x={x} dy="1.1em">
        {payload.count}
      </tspan>
    </text>
  );
};

export default function EmotionNoteDetailSectionChart({
  sections,
  selectedKey,
  onSelect,
}: EmotionNoteDetailSectionChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [radius, setRadius] = useState(120);
  const [isReady, setIsReady] = useState(false);
  const data: ChartDatum[] = sections.map((section) => ({
    key: section.key,
    label: section.label,
    count: section.count,
    value: section.count > 0 ? section.count : MIN_VALUE,
    color: section.color,
  }));
  const outerRadius = radius * 0.88;
  const activeOuterRadius = radius * 0.96;
  const innerRadius = radius * 0.26;

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateSize = () => {
      const size = Math.min(element.clientWidth, element.clientHeight);
      if (size > 0) {
        setRadius(size / 2);
        setIsReady(true);
        return;
      }
      setIsReady(false);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartWrapper} ref={wrapperRef}>
        {isReady ? (
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={260}
            minHeight={260}
            aspect={1}
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={innerRadius}
                outerRadius={(entry) =>
                  entry.key === selectedKey ? activeOuterRadius : outerRadius
                }
                paddingAngle={1}
                cornerRadius={8}
                stroke="none"
                labelLine={false}
                label={renderLabel}
                onClick={(entry) => onSelect(entry.key)}
                isAnimationActive={false}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.chartPlaceholder} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
