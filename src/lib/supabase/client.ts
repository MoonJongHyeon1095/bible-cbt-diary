import { createClient } from "@supabase/supabase-js";

type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createStorageAdapter = (): StorageAdapter => {
  if (typeof window === "undefined") {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    };
  }

  const canUseStorage = (storage: Storage) => {
    try {
      const testKey = "__sb_test__";
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  if (canUseStorage(window.localStorage)) {
    return window.localStorage;
  }

  if (canUseStorage(window.sessionStorage)) {
    return window.sessionStorage;
  }

  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
};

export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: createStorageAdapter(),
    },
  });
};
