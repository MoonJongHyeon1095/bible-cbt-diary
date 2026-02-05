import type { CbtToastVariant } from "@/components/cbt/common/CbtToast";
import { fetchTokenUsageStatus } from "@/lib/api/token-usage/getTokenUsageStatus";
import type { TokenUsageStatus } from "@/lib/api/token-usage/getTokenUsageStatus";

export const MEMBER_DAILY_LIMIT = 20000;
export const MEMBER_MONTHLY_LIMIT = 150000;
export const GUEST_DAILY_LIMIT = 15000;
export const GUEST_MONTHLY_LIMIT = 50000;

export type ToastHandler = (message: string, variant?: CbtToastVariant) => void;

export type AiUsageDecision = {
  allowed: boolean;
  message?: string;
};

export const getAiUsageDecision = (status: TokenUsageStatus): AiUsageDecision => {
  const dailyLimit = status.is_member ? MEMBER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const monthlyLimit = status.is_member
    ? MEMBER_MONTHLY_LIMIT
    : GUEST_MONTHLY_LIMIT;

  if (status.usage.daily_usage >= dailyLimit) {
    return {
      allowed: false,
      message: "당일 토큰 사용량을 초과했습니다. (KST 09:00 초기화)",
    };
  }

  if (status.usage.monthly_usage >= monthlyLimit) {
    return {
      allowed: false,
      message: "월 토큰 사용량을 초과했습니다. (KST 09:00 초기화)",
    };
  }

  return { allowed: true };
};

export const checkAiUsageLimit = async (pushToast?: ToastHandler) => {
  try {
    const status = await fetchTokenUsageStatus();
    const decision = getAiUsageDecision(status);
    if (!decision.allowed) {
      pushToast?.(decision.message ?? "토큰 사용량을 초과했습니다.", "error");
      return false;
    }
  } catch (error) {
    console.error("token usage check failed:", error);
    pushToast?.("토큰 사용량 확인 중 서버 오류가 발생했습니다.", "error");
    return false;
  }

  return true;
};
