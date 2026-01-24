"use client";

import styles from "./EmotionNoteDetailPage.module.css";

type SectionKey = "thought" | "error" | "alternative" | "behavior";

type SectionConfig = {
  key: SectionKey;
  label: string;
  color: string;
  count: number;
};

type EmotionNoteSectionChartProps = {
  sections: SectionConfig[];
  selectedKey: SectionKey | null;
  onSelect: (key: SectionKey) => void;
};

const MIN_VALUE = 1;

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle),
});

const describeDonutSlice = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
};

const getMidPoint = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const midAngle = (startAngle + endAngle) / 2;
  return polarToCartesian(cx, cy, radius, midAngle);
};

export default function EmotionNoteSectionChart({
  sections,
  selectedKey,
  onSelect,
}: EmotionNoteSectionChartProps) {
  const values = sections.map((section) =>
    section.count > 0 ? section.count : MIN_VALUE,
  );
  const total = values.reduce((sum, value) => sum + value, 0);
  let currentAngle = -Math.PI / 2;
  const outerRadius = 52;
  const innerRadius = 18;
  const labelRadius = (outerRadius + innerRadius) / 2;

  return (
    <div className={styles.chartShell}>
      <div className={styles.chartWrapper}>
        <svg
          viewBox="0 0 120 120"
          className={styles.chartSvg}
          aria-hidden
        >
          {(() => {
            const slices = sections.map((section, index) => {
            const sliceAngle = (values[index] / total) * Math.PI * 2;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;
            const path = describeDonutSlice(
              60,
              60,
              outerRadius,
              innerRadius,
              startAngle,
              endAngle,
            );
            const isActive = selectedKey === section.key;
            const midPoint = getMidPoint(60, 60, labelRadius, startAngle, endAngle);

            return {
              key: section.key,
              isActive,
              node: (
                <g
                  key={section.key}
                  className={`${styles.chartSlice} ${
                    isActive ? styles.chartSliceActive : ""
                  }`}
                  onClick={() => onSelect(section.key)}
                  role="button"
                  aria-label={`${section.label} ${section.count}개`}
                >
                  <path d={path} fill={section.color} />
                  <text
                    x={midPoint.x}
                    y={midPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={styles.chartLabel}
                  >
                    <tspan x={midPoint.x} dy="-0.1em">
                      {section.label}
                    </tspan>
                    <tspan x={midPoint.x} dy="1.1em">
                      {section.count}
                    </tspan>
                  </text>
                </g>
              ),
            };
          });

            const active = slices.filter((slice) => slice.isActive);
            const inactive = slices.filter((slice) => !slice.isActive);
            return [...inactive, ...active].map((slice) => slice.node);
          })()}
        </svg>
      </div>
    </div>
  );
}
