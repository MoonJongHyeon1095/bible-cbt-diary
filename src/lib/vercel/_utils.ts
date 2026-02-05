import type { VercelRequest, VercelResponse } from "@vercel/node";

export const json = (res: VercelResponse, status: number, payload: unknown) => {
  res.status(status).json(payload);
};

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

export const methodNotAllowed = (res: VercelResponse) =>
  json(res, 405, { error: "Method Not Allowed" });

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

export const normalizeDeviceId = (value?: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};
