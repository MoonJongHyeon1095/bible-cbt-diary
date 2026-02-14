"use client";

import styles from "../../EntranceOverlay.module.css";

type EntranceIntroSceneProps = {
  title: string;
  subtext: string;
};

const makeShakyChars = (value: string) =>
  value.split("").map((char, index) => {
    if (char === "\n") {
      return <br key={`line-${index}`} />;
    }
    return (
      <span
        key={`char-${index}`}
        className={styles.shakyChar}
        style={{ ["--char-i" as string]: index }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    );
  });

export default function EntranceIntroScene({
  title,
  subtext,
}: EntranceIntroSceneProps) {
  return (
    <div className={styles.introWrap}>
      <div className={styles.introTextGroup}>
        <h2 className={styles.introTitle}>{title}</h2>
        <p className={styles.introSub}>{makeShakyChars(subtext)}</p>
      </div>
    </div>
  );
}
