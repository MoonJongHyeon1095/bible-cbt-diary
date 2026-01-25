"use client";

import { Info } from "lucide-react";
import { COGNITIVE_BEHAVIORS } from "@/lib/constants/behaviors";
import { EMOTIONS } from "@/lib/constants/emotions";
import { COGNITIVE_ERRORS } from "@/lib/constants/errors";
import { BehaviorInfoPopover } from "./pop-over/BehaviorInfoPopover";
import { CognitiveErrorInfoPopover } from "./pop-over/CognitiveErrorInfoPopover";
import {
  getBehaviorMeta,
  getCognitiveErrorMeta,
} from "./pop-over/InfoPopoverMeta";
import styles from "./PatternSelectors.module.css";

interface EmotionSelectorProps {
  value: string;
  onSelect: (next: string) => void;
}

export const EmotionSelector = ({ value, onSelect }: EmotionSelectorProps) => {
  const emotionOptions = EMOTIONS.map((e) => e.label);
  return (
    <div className={styles.container}>
      {emotionOptions.map((label) => {
        const active = value === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            className={[
              styles.button,
              active ? styles.activeAmber : styles.inactiveAmber,
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

interface ErrorSelectorProps {
  value: string;
  onSelect: (next: string) => void;
}

export const ErrorSelector = ({ value, onSelect }: ErrorSelectorProps) => (
  <div className={styles.container}>
    {COGNITIVE_ERRORS.map((error) => {
      const active = value === error.title;
      const meta = getCognitiveErrorMeta(error.title);
      return (
        <button
          key={error.id}
          type="button"
          onClick={() => onSelect(error.title)}
          className={[
            styles.button,
            active ? styles.activeRose : styles.inactiveRose,
          ].join(" ")}
        >
          <span className={styles.buttonInner}>
            <span>{error.title}</span>
            {active && meta && (
              <CognitiveErrorInfoPopover errorLabel={meta.title}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                    }
                  }}
                  className={styles.infoButton}
                  aria-label={`${meta.title} 설명 보기`}
                >
                  <Info size={12} />
                </span>
              </CognitiveErrorInfoPopover>
            )}
          </span>
        </button>
      );
    })}
  </div>
);

interface BehaviorSelectorProps {
  value: string;
  onSelect: (next: string) => void;
}

export const BehaviorSelector = ({
  value,
  onSelect,
}: BehaviorSelectorProps) => (
  <div className={styles.container}>
    {COGNITIVE_BEHAVIORS.map((behavior) => {
      const active = value === behavior.replacement_title;
      const meta = getBehaviorMeta(behavior.replacement_title);
      return (
        <button
          key={behavior.id}
          type="button"
          onClick={() => onSelect(behavior.replacement_title)}
          className={[
            styles.button,
            active ? styles.activeBlue : styles.inactiveBlue,
          ].join(" ")}
        >
          <span className={styles.buttonInner}>
            <span>{behavior.replacement_title}</span>
            {active && meta && (
              <BehaviorInfoPopover
                behaviorLabel={meta.replacement_title}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.stopPropagation();
                    }
                  }}
                  className={styles.infoButton}
                  aria-label={`${meta.replacement_title} 설명 보기`}
                >
                  <Info size={12} />
                </span>
              </BehaviorInfoPopover>
            )}
          </span>
        </button>
      );
    })}
  </div>
);
