"use client";

import {
  dismissNoticeToday,
  loadNotices,
  pickActiveNotice,
  type NoticeItem,
} from "@/lib/notice/notice";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useGate } from "@/components/notice/GateProvider";
import styles from "./Notice.module.css";

const NOTICE_PATHS = ["/", "/today"];

export default function Notice() {
  const [notice, setNotice] = useState<NoticeItem | null>(null);
  const pathname = usePathname();
  const { status, setNoticeStatus } = useGate();

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!status.terms.ready || !status.update.ready) {
        setNoticeStatus({ ready: false, open: false });
        return;
      }

      if (status.update.blocking || status.terms.blocking) {
        setNotice(null);
        setNoticeStatus({ ready: true, open: false });
        return;
      }

      setNoticeStatus({ ready: false, open: false });
      if (!pathname || !NOTICE_PATHS.includes(pathname)) {
        setNotice(null);
        setNoticeStatus({ ready: true, open: false });
        return;
      }
      const payload = await loadNotices();
      if (!active) return;
      const nextNotice = pickActiveNotice(payload);
      if (!nextNotice) {
        setNotice(null);
        setNoticeStatus({ ready: true, open: false });
        return;
      }
      setNotice(nextNotice);
      setNoticeStatus({ ready: true });
    };

    load();

    return () => {
      active = false;
    };
  }, [
    pathname,
    setNoticeStatus,
    status.terms.ready,
    status.terms.blocking,
    status.update.ready,
    status.update.blocking,
  ]);

  useEffect(() => {
    setNoticeStatus({ open: Boolean(notice) });
    if (notice === null) {
      setNoticeStatus({ ready: true });
    }
  }, [notice, setNoticeStatus]);

  if (!notice) return null;

  const badgeClass = `${styles.noticeBadge} ${
    notice.level === "critical"
      ? styles.noticeCritical
      : notice.level === "warning"
      ? styles.noticeWarning
      : styles.noticeInfo
  }`;

  const blocks: Array<
    | { type: "list"; items: string[] }
    | { type: "paragraph"; text: string }
  > = [];
  const lines = notice.body.split("\n");
  let currentList: string[] | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return;
    blocks.push({ type: "paragraph", text: currentParagraph.join("\n") });
    currentParagraph = [];
  };

  const flushList = () => {
    if (!currentList || currentList.length === 0) return;
    blocks.push({ type: "list", items: currentList });
    currentList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      if (!currentList) {
        currentList = [];
      }
      currentList.push(numberedMatch[1].trim());
      continue;
    }

    if (currentList) {
      flushList();
    }
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();

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
          {blocks.map((block, index) =>
            block.type === "list" ? (
              <ol key={`block-${index}`} className={styles.noticeList}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
              </ol>
            ) : (
              <p key={`block-${index}`} className={styles.noticeParagraph}>
                {block.text}
              </p>
            ),
          )}
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
              오늘 그만 보기
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
