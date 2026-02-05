export type NoticeLevel = "info" | "warning" | "critical";

export type NoticeItem = {
  id: string; // 사용자가 “다시 안 보기” 눌렀을 때 기억하는 키
  title: string;
  body: string;
  level: NoticeLevel;
  startAt?: string; // 공지 노출 기간
  endAt?: string; // 공지 노출 기간
  minAppVersion?: string; // 특정 버전 이상/이하 조건 걸고 싶을 때
  force?: boolean; // 강제 공지(닫아도 계속 띄우기 같은 거)
  link?: string; // 공지에서 “자세히 보기” 눌렀을 때 열릴 URL
};

export type NoticePayload = {
  updatedAt: string;
  items: NoticeItem[];
};

const NOTICE_URL = process.env.NEXT_PUBLIC_NOTICE_URL;

const DISMISSED_KEY = "notice_dismissed_v1";
const DISMISSED_TODAY_KEY = "notice_dismissed_today_v1";

function nowMs() {
  return Date.now();
}

function isWithinWindow(n: NoticeItem) {
  const t = nowMs();
  const start = n.startAt ? Date.parse(n.startAt) : -Infinity;
  const end = n.endAt ? Date.parse(n.endAt) : Infinity;
  return t >= start && t <= end;
}

export function getDismissedSet(): Set<string> {
  try {
    const arr = JSON.parse(safeLocalStorage.getItem(DISMISSED_KEY) || "[]");
    return new Set<string>(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function dismissNotice(id: string) {
  const s = getDismissedSet();
  s.add(id);
  safeLocalStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function dismissNoticeToday(id: string) {
  try {
    const raw = safeLocalStorage.getItem(DISMISSED_TODAY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[id] = todayKey();
    safeLocalStorage.setItem(DISMISSED_TODAY_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function isDismissedToday(id: string) {
  try {
    const raw = safeLocalStorage.getItem(DISMISSED_TODAY_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[id] === todayKey();
  } catch {
    return false;
  }
}

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

export function pickActiveNotice(payload: NoticePayload | null): NoticeItem | null {
  if (!payload?.items?.length) return null;

  const dismissed = getDismissedSet();
  const rank = (l: NoticeLevel) => (l === "critical" ? 3 : l === "warning" ? 2 : 1);

  const candidates = payload.items
    .filter(isWithinWindow)
    .sort((a, b) => (rank(b.level) - rank(a.level)) || (Number(!!b.force) - Number(!!a.force)));

  const forceOne = candidates.find((n) => n.force);
  if (forceOne) return forceOne;

  const notDismissed = candidates.find(
    (n) => !dismissed.has(n.id) && !isDismissedToday(n.id),
  );
  return notDismissed || null;
}
import { safeLocalStorage } from "@/lib/utils/safeStorage";
