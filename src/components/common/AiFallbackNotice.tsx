"use client";

import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import styles from "./AiFallbackNotice.module.css";

type AiFallbackNoticeProps = {
  onRetry: () => void;
  message?: string;
  description?: string;
};

export default function AiFallbackNotice({
  onRetry,
  message = "연결에 실패했습니다.",
  description = "기본 문구를 대신 표시하고 있어요.",
}: AiFallbackNoticeProps) {
  return (
    <div className={styles.notice} role="status" aria-live="polite">
      <div className={styles.text}>
        <div className={styles.title}>{message}</div>
        <div className={styles.desc}>{description}</div>
      </div>
      <div className={styles.action}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRetry}
          aria-label="다시 시도"
          icon={<RefreshCw size={18} />}
        >
          {null}
        </Button>
      </div>
    </div>
  );
}
