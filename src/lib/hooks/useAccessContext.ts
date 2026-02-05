import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccessContext, AccessMode } from "@/lib/types/access";
import { isGuestStorageAvailable } from "@/lib/utils/guestStorage";
import { startPerf } from "@/lib/utils/perf";
import { useEffect, useMemo, useState } from "react";

type AccessState = AccessContext & {
  isLoading: boolean;
};

const resolveGuestMode = (): AccessMode =>
  isGuestStorageAvailable() ? "guest" : "blocked";

type AccessSubscriber = (state: AccessState) => void;

let sharedState: AccessState = {
  mode: "blocked",
  accessToken: null,
  userEmail: null,
  isLoading: true,
};

const subscribers = new Set<AccessSubscriber>();
let initialized = false;
let initPromise: Promise<void> | null = null;
let authSubscription: { subscription: { unsubscribe: () => void } } | null =
  null;

const emitState = () => {
  subscribers.forEach((listener) => listener(sharedState));
};

const setSharedState = (next: AccessState) => {
  sharedState = next;
  emitState();
};

const initAccessContext = (
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
) => {
  if (initialized) return initPromise;
  initialized = true;
  initPromise = (async () => {
    const endPerf = startPerf("access:resolveSession");
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token ?? null;
    if (accessToken) {
      setSharedState({
        mode: "auth",
        accessToken,
        userEmail: data.session?.user?.email ?? null,
        isLoading: false,
      });
      endPerf();
    } else {
      setSharedState({
        mode: resolveGuestMode(),
        accessToken: null,
        userEmail: null,
        isLoading: false,
      });
      endPerf();
    }
  })();

  if (!authSubscription) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setSharedState({
          mode: "auth",
          accessToken: session.access_token,
          userEmail: session.user?.email ?? null,
          isLoading: false,
        });
        return;
      }
      setSharedState({
        mode: resolveGuestMode(),
        accessToken: null,
        userEmail: null,
        isLoading: false,
      });
    });
    authSubscription = data ?? null;
  }

  return initPromise;
};

export const useAccessContext = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<AccessState>(sharedState);

  useEffect(() => {
    let active = true;
    const handleUpdate = (next: AccessState) => {
      if (!active) return;
      setState(next);
    };
    subscribers.add(handleUpdate);
    setState(sharedState);
    void initAccessContext(supabase);

    // return 문 cleanup 콜백 : 컴포넌트가 언마운트될 때 또는 deps가 바뀌어 effect가 교체되기 직전에 실행
    return () => {
      active = false;
      subscribers.delete(handleUpdate);
    };
  }, [supabase]);

  return {
    accessMode: state.mode,
    accessToken: state.accessToken,
    userEmail: state.userEmail,
    isLoading: state.isLoading,
    isAuthenticated: state.mode === "auth",
    isGuest: state.mode === "guest",
    isBlocked: state.mode === "blocked",
  };
};
