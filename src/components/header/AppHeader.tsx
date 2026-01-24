"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import AppTabs from "@/components/tab/AppTabs";
import LogoSection from "./LogoSection";
import AuthModal from "./AuthModal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./AppHeader.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

export default function AppHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <header className={styles.header}>
      <div className={styles.logoSlot}>
        <LogoSection />
      </div>
      <div className={styles.tabsSlot}>
        <AppTabs />
      </div>
      <div className={styles.actions}>
        {user ? (
          <div className={styles.userBox}>
            <span className={styles.userEmail}>{user.email}</span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleSignOut}
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.loginButton}
            onClick={() => setIsModalOpen(true)}
          >
            <LogIn size={18} />
            로그인
          </button>
        )}
      </div>
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSignedIn={(nextUser) => {
          setUser(nextUser);
        }}
      />
    </header>
  );
}
