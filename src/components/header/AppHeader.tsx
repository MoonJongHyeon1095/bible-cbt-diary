"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, NotebookPen } from "lucide-react";
import AppTabs from "@/components/tab/AppTabs";
import AuthModal from "./AuthModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./AppHeader.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

export default function AppHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

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
      <div className={styles.brandBlock}>
        <div className={styles.brandRow}>
          <span className={styles.brandIcon} aria-hidden>
            <NotebookPen size={18} />
          </span>
          <h1 className={styles.brandTitle}>Emotion Notes</h1>
        </div>
        <p className={styles.brandSubtitle}>
          오늘의 감정을 짧게 기록하고 흐름을 확인하세요.
        </p>
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
