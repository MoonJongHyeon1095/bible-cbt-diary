"use client";

import AppTabs from "@/components/tab/AppTabs";
import SafeButton from "@/components/ui/SafeButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./AppHeader.module.css";
import CompactNav from "./navigation/CompactNav";
import dynamic from "next/dynamic";

type SessionUser = {
  id: string;
  email: string | null;
};

const DisclaimerBanner = dynamic(() => import("./DisclaimerBanner"), {
  ssr: false,
});

export default function AppHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const { openAuthModal } = useAuthModal();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(
        data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
      );
    };
    loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(
          session?.user
            ? { id: session.user.id, email: session.user.email ?? null }
            : null,
        );
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoSlot}>
          <CompactNav userEmail={user?.email ?? null} />
        </div>
        <div className={styles.tabsSlot}>
          <AppTabs />
        </div>
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userBox}>
              <SafeButton
                type="button"
                variant="unstyled"
                className={styles.iconButton}
                onClick={handleSignOut}
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut size={18} />
              </SafeButton>
            </div>
          ) : (
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.loginButton}
              onClick={() => openAuthModal()}
            >
              <LogIn size={18} />
              로그인
            </SafeButton>
          )}
        </div>
      </header>
      <div className={styles.disclaimerWrap}>
        <DisclaimerBanner
          detailsClassName={styles.disclaimerDetails}
          titleClassName={styles.disclaimerTitle}
          textClassName={styles.disclaimerText}
        />
      </div>

    </>
  );
}
