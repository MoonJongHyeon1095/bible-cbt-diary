"use client";

import { useGate } from "@/components/gate/GateProvider";
import styles from "./NoticeGate.module.css";
import SafeButton from "@/components/ui/SafeButton";

export default function UpdateNoticeGate() {
  const { status, setUpdateStatus } = useGate();

  if (!status.update.failed) return null;

  return (
    <div className={styles.noticeOverlay} role="dialog" aria-modal="true">
      <div className={styles.noticeCard}>
        <div className={`${styles.noticeBadge} ${styles.noticeWarning}`}>
          업데이트 확인 실패
        </div>
        <h2 className={styles.noticeTitle}>업데이트 상태를 확인할 수 없어요</h2>
        <div className={styles.noticeBody}>
          <p className={styles.noticeParagraph}>
            네트워크 또는 스토어 연결 문제로 업데이트 확인에 실패했습니다.
            스토어에서 최신 버전을 확인한 뒤 다시 시도해주세요.
          </p>
        </div>
        <div className={styles.noticeActions}>
          <SafeButton mode="native"
            type="button"
            className={`${styles.noticeButton} ${styles.noticeButtonPrimary}`}
            onClick={() => setUpdateStatus({ failed: false })}
          >
            확인
          </SafeButton>
        </div>
      </div>
    </div>
  );
}
