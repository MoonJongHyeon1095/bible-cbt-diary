"use client";

import type { NoticePayload } from "@/lib/notice/notice";

const NOTICE_URL = process.env.NEXT_PUBLIC_NOTICE_URL;

// GET $NEXT_PUBLIC_NOTICE_URL
// notice 조회
export async function loadNotices(): Promise<NoticePayload | null> {
  if (!NOTICE_URL) return null;

  try {
    const res = await fetch(NOTICE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`notice fetch failed: ${res.status}`);
    const data = (await res.json()) as NoticePayload;
    return data;
  } catch {
    return null;
  }
}
