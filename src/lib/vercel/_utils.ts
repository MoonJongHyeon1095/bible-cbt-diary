import type { VercelRequest, VercelResponse } from "@vercel/node";

// INTERNAL (no api route)
// api 응답 JSON 헬퍼
export const json = (res: VercelResponse, status: number, payload: unknown) => {
  res.status(status).json(payload);
};

// INTERNAL (no api route)
// api 요청 바디 JSON 파싱
export const readJson = async <T = Record<string, unknown>>(
  req: VercelRequest,
): Promise<T> => {
  const body = req.body;
  if (body == null) {
    return {} as T;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }

  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf-8")) as T;
    } catch {
      return {} as T;
    }
  }

  return body as T;
};

// INTERNAL (no api route)
// api 요청 쿼리 파라미터 추출
export const getQueryParam = (
  req: VercelRequest,
  key: string,
): string | null => {
  const value = req.query?.[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  if (value === undefined) {
    return null;
  }
  return String(value);
};

// INTERNAL (no api route)
// api 메서드 제한 응답
export const methodNotAllowed = (res: VercelResponse) =>
  json(res, 405, { error: "Method Not Allowed" });

// INTERNAL (no api route)
// api CORS 처리
export const handleCors = (req: VercelRequest, res: VercelResponse) => {
  const origin = req.headers.origin ?? "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-API-KEY",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
};

// INTERNAL (no api route)
// api deviceId 정규화
export const normalizeDeviceId = (value?: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};
