import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { HOME_LAST_ENTRY_DATE_KEY } from "@/lib/storage/keys/ui";
import { formatKoreanDateKey } from "@/lib/utils/time";

export const resolveDailyEntryPath = () => {
  const todayKey = formatKoreanDateKey(new Date());

  if (!safeLocalStorage.isAvailable()) {
    return "/home";
  }

  const lastVisitedDate = safeLocalStorage.getItem(HOME_LAST_ENTRY_DATE_KEY);
  if (lastVisitedDate === todayKey) {
    return "/list";
  }

  safeLocalStorage.setItem(HOME_LAST_ENTRY_DATE_KEY, todayKey);
  return "/home";
};
