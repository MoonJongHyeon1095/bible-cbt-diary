"use client";

import styles from "./RequireLoginPrompt.module.css";

type RequireLoginPromptProps = {
  title?: string;
  subtitle?: string;
};

export default function RequireLoginPrompt({
  title = "로그인이 필요합니다",
  subtitle = "우측 상단에서 이메일 로그인을 진행해주세요.",
}: RequireLoginPromptProps) {
  return (
    <div className={styles.prompt}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}
