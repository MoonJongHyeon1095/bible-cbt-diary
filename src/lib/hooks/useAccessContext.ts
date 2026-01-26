import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccessMode, AccessContext } from "@/lib/types/access";
import {
  clearGuestData,
  hasGuestData,
  isGuestStorageAvailable,
  uploadGuestData,
} from "@/lib/utils/guestStorage";

type AccessState = AccessContext & {
  isLoading: boolean;
};

const resolveGuestMode = (): AccessMode =>
  isGuestStorageAvailable() ? "guest" : "blocked";

export const useAccessContext = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<AccessState>({
    mode: "blocked",
    accessToken: null,
    userEmail: null,
    isLoading: true,
  });
  const isUploadingRef = useRef(false);

  useEffect(() => {
    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? null;
      if (accessToken) {
        setState({
          mode: "auth",
          accessToken,
          userEmail: data.session?.user?.email ?? null,
          isLoading: false,
        });
        return;
      }
      setState({
        mode: resolveGuestMode(),
        accessToken: null,
        userEmail: null,
        isLoading: false,
      });
    };

    resolveSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          setState({
            mode: "auth",
            accessToken: session.access_token,
            userEmail: session.user?.email ?? null,
            isLoading: false,
          });
          return;
        }
        setState({
          mode: resolveGuestMode(),
          accessToken: null,
          userEmail: null,
          isLoading: false,
        });
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (state.mode !== "auth" || !state.accessToken) {
      return;
    }
    if (isUploadingRef.current) {
      return;
    }
    if (!hasGuestData()) {
      return;
    }
    isUploadingRef.current = true;
    uploadGuestData(state.accessToken)
      .then((result) => {
        if (result.ok) {
          clearGuestData();
        }
      })
      .finally(() => {
        isUploadingRef.current = false;
      });
  }, [state.accessToken, state.mode]);

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
