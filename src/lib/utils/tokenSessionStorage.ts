import { syncTokenUsage } from "@/lib/utils/tokenUsage";

export const TOKEN_SESSION_KEY = "gpt_usage_total";

export type TokenUsage = {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
};

export const readTokenSessionUsage = (): TokenUsage | null => {
  try {
    const raw = sessionStorage.getItem(TOKEN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      total_tokens: Number(parsed?.total_tokens || 0),
      input_tokens: Number(parsed?.input_tokens || 0),
      output_tokens: Number(parsed?.output_tokens || 0),
      request_count: Number(parsed?.request_count || 0),
    };
  } catch {
    return null;
  }
};

export const writeTokenSessionUsage = (usage: TokenUsage) => {
  try {
    sessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(usage));
  } catch {
    // ignore
  }
};

export const clearTokenSessionStorage = async () => {
  try {
    const usage = readTokenSessionUsage();
    if (!usage) return;
    const hasUsage =
      usage.total_tokens > 0 ||
      usage.input_tokens > 0 ||
      usage.output_tokens > 0 ||
      usage.request_count > 0;
    if (!hasUsage) {
      sessionStorage.removeItem(TOKEN_SESSION_KEY);
      return;
    }
    await syncTokenUsage(usage);
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  } catch {
    // ignore
  }
};
