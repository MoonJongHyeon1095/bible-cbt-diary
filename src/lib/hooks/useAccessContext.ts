import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccessContext, AccessMode } from "@/lib/types/access";
import { isDeviceIdAvailable } from "@/lib/storage/device/deviceId";
import { startPerf } from "@/lib/utils/perf";
import { useEffect, useMemo, useState } from "react";

type AccessState = AccessContext & {
  isLoading: boolean;
};

// 게스트 스토리지 사용 가능 여부에 따라 게스트 모드를 결정
const resolveGuestMode = (): AccessMode =>
  isDeviceIdAvailable() ? "guest" : "blocked";

type AccessSubscriber = (state: AccessState) => void;

// 모듈 단위로 공유되는 전역 상태 (모든 hook 인스턴스가 공유)
let sharedState: AccessState = {
  mode: "blocked",
  accessToken: null,
  userEmail: null,
  isLoading: true,
};

// 상태 변경을 수신하는 구독자 목록
const subscribers = new Set<AccessSubscriber>();
// 최초 1회 초기화 플래그 및 초기화 Promise 캐시
let initialized = false;
let initPromise: Promise<void> | null = null;
// Supabase auth 상태 구독 (중복 구독 방지)
let authSubscription: { subscription: { unsubscribe: () => void } } | null =
  null;

const emitState = () => {
  subscribers.forEach((listener) => listener(sharedState));
};

// 전역 상태 갱신 + 모든 구독자에게 브로드캐스트
const setSharedState = (next: AccessState) => {
  sharedState = next;
  emitState();
};

const initAccessContext = (
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
) => {
  // 이미 초기화가 시작되었다면 동일 Promise 재사용 (중복 호출 방지)
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

  // auth 상태 변화 구독은 앱 전체에서 1회만 등록
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
  // 브라우저 전용 Supabase 클라이언트를 싱글턴으로 사용
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  // 초기 상태는 전역 sharedState를 그대로 반영
  const [state, setState] = useState<AccessState>(sharedState);

  useEffect(() => {
    let active = true;
    const handleUpdate = (next: AccessState) => {
      if (!active) return;
      setState(next);
    };
    // 구독 등록 및 즉시 현재 상태 반영
    subscribers.add(handleUpdate);
    setState(sharedState);
    // 최초 1회 세션 조회 및 auth 구독 등록
    void initAccessContext(supabase);

    // return 문 cleanup 콜백 : 컴포넌트가 언마운트될 때 또는 deps가 바뀌어 effect가 교체되기 직전에 실행
    return () => {
      active = false;
      // 구독 해제 (컴포넌트별 cleanup)
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
