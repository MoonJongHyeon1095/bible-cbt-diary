"use client";

import { EMOTIONS } from "@/lib/constants/emotions";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import styles from "./EmotionNoteAddPage.module.css";

type SingleSelectorProps = {
  value: string;
  onSelect: (next: string) => void;
};

type BehaviorOption = (typeof COGNITIVE_BEHAVIORS)[number];
type BehaviorSelectorProps = SingleSelectorProps & {
  options?: ReadonlyArray<BehaviorOption>;
};

type MultiSelectorProps = {
  values: string[];
  onToggle: (next: string) => void;
  maxSelected?: number;
};

const optionPalettes = [
  styles.optionToneRose,
  styles.optionToneAmber,
  styles.optionToneBlue,
  styles.optionToneIndigo,
  styles.optionToneEmerald,
  styles.optionToneCyan,
  styles.optionToneViolet,
  styles.optionToneSlate,
];

const getPaletteClass = (index: number) =>
  optionPalettes[index % optionPalettes.length];

export function EmotionOptionSelector({ value, onSelect }: SingleSelectorProps) {
  return (
    <div className={styles.optionGrid}>
      {EMOTIONS.map((emotion) => {
        const active = value === emotion.label;
        return (
          <button
            key={emotion.id}
            type="button"
            onClick={() => onSelect(emotion.label)}
            data-emotion={emotion.id}
            className={[
              styles.optionTile,
              styles.optionTileEmotion,
              active ? styles.optionTileSelected : "",
            ].join(" ")}
          >
            <span className={styles.optionTitle}>{emotion.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ErrorOptionSelector({ value, onSelect }: SingleSelectorProps) {
  return (
    <div className={styles.optionGrid}>
      {COGNITIVE_ERRORS.map((error, index) => {
        const active = value === error.title;
        return (
          <button
            key={error.id}
            type="button"
            onClick={() => onSelect(error.title)}
            className={[
              styles.optionTile,
              getPaletteClass(index),
              active ? styles.optionTileSelected : "",
            ].join(" ")}
          >
            <span className={styles.optionTitle}>{error.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BehaviorOptionSelector({
  value,
  onSelect,
  options,
}: BehaviorSelectorProps) {
  const behaviorOptions = options ?? COGNITIVE_BEHAVIORS;
  return (
    <div className={styles.optionGrid}>
      {behaviorOptions.map((behavior, index) => {
        const active = value === behavior.replacement_title;
        return (
          <button
            key={behavior.id}
            type="button"
            onClick={() => onSelect(behavior.replacement_title)}
            className={[
              styles.optionTile,
              getPaletteClass(index),
              active ? styles.optionTileSelected : "",
            ].join(" ")}
          >
            <span className={styles.optionTitle}>
              {behavior.replacement_title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ErrorTagSelector({
  values,
  onToggle,
  maxSelected = Number.POSITIVE_INFINITY,
}: MultiSelectorProps) {
  return (
    <div className={styles.optionGrid}>
      {COGNITIVE_ERRORS.map((error, index) => {
        const active = values.includes(error.title);
        const disabled = !active && values.length >= maxSelected;
        return (
          <button
            key={error.id}
            type="button"
            onClick={() => {
              if (disabled) return;
              onToggle(error.title);
            }}
            className={[
              styles.optionTile,
              getPaletteClass(index),
              active ? styles.optionTileSelected : "",
            ].join(" ")}
            disabled={disabled}
          >
            <span className={styles.optionTitle}>{error.title}</span>
          </button>
        );
      })}
    </div>
  );
}
