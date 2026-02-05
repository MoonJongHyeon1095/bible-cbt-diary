type SafeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
  isAvailable: () => boolean;
};

const createSafeStorage = (type: "local" | "session"): SafeStorage => {
  let cached: Storage | null | undefined;

  const resolveStorage = (): Storage | null => {
    if (cached !== undefined) return cached;
    if (typeof window === "undefined") {
      cached = null;
      return cached;
    }

    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    try {
      const testKey = `__storage_test__${type}`;
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      cached = storage;
      return cached;
    } catch {
      cached = null;
      return cached;
    }
  };

  return {
    getItem: (key) => resolveStorage()?.getItem(key) ?? null,
    setItem: (key, value) => {
      const storage = resolveStorage();
      if (storage) storage.setItem(key, value);
    },
    removeItem: (key) => {
      const storage = resolveStorage();
      if (storage) storage.removeItem(key);
    },
    clear: () => {
      const storage = resolveStorage();
      if (storage) storage.clear();
    },
    key: (index) => resolveStorage()?.key(index) ?? null,
    get length() {
      return resolveStorage()?.length ?? 0;
    },
    isAvailable: () => resolveStorage() !== null,
  };
};

export const safeLocalStorage = createSafeStorage("local");
export const safeSessionStorage = createSafeStorage("session");
export type { SafeStorage };
