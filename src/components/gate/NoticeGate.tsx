"use client";

import {
  dismissNoticeToday,
  loadNotices,
  pickActiveNotice,
  type NoticeItem,
} from "@/lib/notice/notice";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useGate } from "@/components/gate/GateProvider";
import styles from "./NoticeGate.module.css";
import SafeButton from "@/components/ui/SafeButton";

const NOTICE_PATHS = ["/", "/home", "/list"];

export default function NoticeGate() {
  const [notice, setNotice] = useState<NoticeItem | null>(null);
  const pathname = usePathname();
  const { status, setNoticeState } = useGate();

  const applyNoticeState = useCallback(
    (nextNotice: NoticeItem | null, ready: boolean) => {
      setNotice(nextNotice);
      setNoticeState({ ready, open: Boolean(nextNotice) });
    },
    [setNoticeState],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!status.terms.ready || !status.update.ready) {
        applyNoticeState(null, false);
        return;
      }

      if (
        status.update.blocking ||
        status.update.failed ||
        status.terms.blocking
      ) {
        applyNoticeState(null, true);
        return;
      }

      if (!pathname || !NOTICE_PATHS.includes(pathname)) {
        applyNoticeState(null, true);
        return;
      }

      applyNoticeState(null, false);
      const payload = await loadNotices();
      if (!active) return;
      const nextNotice = pickActiveNotice(payload);
      applyNoticeState(nextNotice, true);
    };

    load();

    return () => {
      active = false;
    };
  }, [
    pathname,
    applyNoticeState,
    status.terms.ready,
    status.terms.blocking,
    status.update.ready,
    status.update.blocking,
    status.update.failed,
  ]);

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
            <SafeButton mode="native"
              type="button"
              className={`${styles.noticeButton} ${styles.noticeButtonOutline}`}
              onClick={() => {
                dismissNoticeToday(notice.id);
                applyNoticeState(null, true);
              }}
            >
              오늘 그만 보기
            </SafeButton>
          )}
          {notice.force && (
            <SafeButton mode="native"
              type="button"
              className={`${styles.noticeButton} ${styles.noticeButtonPrimary}`}
              onClick={() => {
                applyNoticeState(null, true);
              }}
            >
              확인
            </SafeButton>
          )}
        </div>
      </div>
    </div>
  );
}
