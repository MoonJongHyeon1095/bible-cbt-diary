import { safeLocalStorage } from "@/lib/utils/safeStorage";

const DEVICE_ID_KEY = "device_id";

const randomId = () =>
  `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export const getDeviceId = () => {
  try {
    const existing = safeLocalStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : randomId();
    safeLocalStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return "unknown";
  }
};

export const isDeviceIdAvailable = () => getDeviceId() !== "unknown";
