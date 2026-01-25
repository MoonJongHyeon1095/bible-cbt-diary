import type { CbtToastVariant } from "@/components/cbt/common/CbtToast";
import { fetchTokenUsageStatus } from "@/lib/utils/tokenUsage";

const MEMBER_DAILY_LIMIT = 20000;
const MEMBER_MONTHLY_LIMIT = 150000;
const GUEST_DAILY_LIMIT = 15000;
const GUEST_MONTHLY_LIMIT = 50000;

export type ToastHandler = (message: string, variant?: CbtToastVariant) => void;

export const checkAiUsageLimit = async (pushToast?: ToastHandler) => {
  try {
    const status = await fetchTokenUsageStatus();
    const dailyLimit = status.is_member ? MEMBER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
    const monthlyLimit = status.is_member
      ? MEMBER_MONTHLY_LIMIT
      : GUEST_MONTHLY_LIMIT;

    if (status.usage.daily_usage >= dailyLimit) {
      pushToast?.(
        "당일 토큰 사용량을 초과했습니다. (KST 09:00 기준 초기화)",
        "error",
      );
      return false;
    }

    if (status.usage.monthly_usage >= monthlyLimit) {
      pushToast?.(
        "월 토큰 사용량을 초과했습니다. (KST 09:00 기준 초기화)",
        "error",
      );
      return false;
    }
  } catch (error) {
    console.error("token usage check failed:", error);
  }

  return true;
};
