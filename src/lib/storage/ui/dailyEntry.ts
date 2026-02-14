import { safeLocalStorage } from "@/lib/storage/core/safeStorage";
import { HOME_LAST_ENTRY_DATE_KEY } from "@/lib/storage/keys/ui";
import { ENTRANCE_COMPLETED_KEY } from "@/lib/storage/keys/entrance";
import { formatKoreanDateKey } from "@/lib/utils/time";

export const resolveDailyEntryPath = () => {
  const todayKey = formatKoreanDateKey(new Date());

  if (!safeLocalStorage.isAvailable()) {
    return "/home";
  }

  const entranceCompleted =
    safeLocalStorage.getItem(ENTRANCE_COMPLETED_KEY) === "true";
  if (!entranceCompleted) {
    return "/entrance";
  }

  const lastVisitedDate = safeLocalStorage.getItem(HOME_LAST_ENTRY_DATE_KEY);
  if (lastVisitedDate === todayKey) {
    return "/list";
  }

  safeLocalStorage.setItem(HOME_LAST_ENTRY_DATE_KEY, todayKey);
  return "/home";
};
