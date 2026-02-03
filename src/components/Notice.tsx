"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  dismissNotice,
  dismissNoticeToday,
  loadNotices,
  pickActiveNotice,
  type NoticeItem,
} from "@/lib/notice/notice";
import styles from "./Notice.module.css";

const NOTICE_PATHS = ["/", "/today"];

export default function Notice() {
  const [notice, setNotice] = useState<NoticeItem | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!pathname || !NOTICE_PATHS.includes(pathname)) {
        return;
      }
      const payload = await loadNotices();
      if (!active) return;
      const nextNotice = pickActiveNotice(payload);
      if (!nextNotice) {
        setNotice(null);
        return;
      }
      setNotice(nextNotice);
    };

    load();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (!notice) return null;

  const badgeClass = `${styles.noticeBadge} ${
    notice.level === "critical"
      ? styles.noticeCritical
      : notice.level === "warning"
        ? styles.noticeWarning
        : styles.noticeInfo
  }`;

  const bodyBlocks = notice.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={styles.noticeOverlay} role="dialog" aria-modal="true">
      <div className={styles.noticeCard}>
        <div className={badgeClass}>
          {notice.level === "critical" && "긴급 공지"}
          {notice.level === "warning" && "중요 안내"}
          {notice.level === "info" && "알림"}
        </div>
        <h2 className={styles.noticeTitle}>{notice.title}</h2>
        <div className={styles.noticeBody}>
          {bodyBlocks.map((block, index) => {
            const lines = block.split("\n").map((line) => line.trim());
            const isNumbered = lines.every((line) => /^\d+\.\s+/.test(line));
            if (isNumbered) {
              return (
                <ol key={`block-${index}`} className={styles.noticeList}>
                  {lines.map((line) => (
                    <li key={line}>{line.replace(/^\d+\.\s+/, "")}</li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={`block-${index}`} className={styles.noticeParagraph}>
                {block}
              </p>
            );
          })}
        </div>
        <div className={styles.noticeActions}>
          {notice.link && (
            <a
              className={`${styles.noticeButton} ${styles.noticeButtonSoft}`}
              href={notice.link}
              target="_blank"
              rel="noreferrer"
            >
              자세히 보기
            </a>
          )}
          {!notice.force && (
            <button
              type="button"
              className={`${styles.noticeButton} ${styles.noticeButtonOutline}`}
              onClick={() => {
                dismissNoticeToday(notice.id);
                setNotice(null);
              }}
            >
              오늘만 안 보기
            </button>
          )}
          {notice.force && (
            <button
              type="button"
              className={`${styles.noticeButton} ${styles.noticeButtonPrimary}`}
              onClick={() => setNotice(null)}
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
