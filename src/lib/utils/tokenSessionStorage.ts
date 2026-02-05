import { syncTokenUsage } from "@/lib/utils/tokenUsage";
import { safeSessionStorage } from "@/lib/utils/safeStorage";

export const TOKEN_SESSION_KEY = "gpt_usage_total";

export type TokenUsage = {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  note_proposal_count?: number;
};

export const readTokenSessionUsage = (): TokenUsage | null => {
  try {
    const raw = safeSessionStorage.getItem(TOKEN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      total_tokens: Number(parsed?.total_tokens || 0),
      input_tokens: Number(parsed?.input_tokens || 0),
      output_tokens: Number(parsed?.output_tokens || 0),
      request_count: Number(parsed?.request_count || 0),
      note_proposal_count: Number(parsed?.note_proposal_count || 0),
    };
  } catch {
    return null;
  }
};

export const writeTokenSessionUsage = (usage: TokenUsage) => {
  try {
    safeSessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(usage));
  } catch {
    // ignore
  }
};

export const clearTokenSessionStorage = () => {
  try {
    safeSessionStorage.removeItem(TOKEN_SESSION_KEY);
  } catch {
    // ignore
  }
};

export const flushTokenSessionUsage = async (options?: {
  sessionCount?: number;
}) => {
  const usage = readTokenSessionUsage();
  const mergedUsage: TokenUsage = usage ?? {
    total_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    request_count: 0,
    note_proposal_count: 0,
  };
  const hasUsage =
    mergedUsage.total_tokens > 0 ||
    mergedUsage.input_tokens > 0 ||
    mergedUsage.output_tokens > 0 ||
    mergedUsage.request_count > 0 ||
    (mergedUsage.note_proposal_count ?? 0) > 0 ||
    (options?.sessionCount ?? 0) > 0;

  try {
    if (!hasUsage) return;
    await syncTokenUsage(mergedUsage, {
      session_count: options?.sessionCount ?? 0,
    });
  } catch {
    // ignore
  } finally {
    clearTokenSessionStorage();
  }
};
