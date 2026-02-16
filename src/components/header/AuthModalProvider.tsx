"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/header/AuthModal";
import GuestMigrationModal from "@/components/header/GuestMigrationModal";
import { useGuestMigration } from "@/lib/hooks/useGuestMigration";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const AUTH_MIGRATION_CHECK_KEY = "auth:guest-migration-check-pending";

type AuthModalContextValue = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const {
    isPromptOpen,
    isUploading,
    error,
    checkMigrationCandidate,
    confirmMigration,
    declineMigration,
  } = useGuestMigration();

  const openAuthModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignedIn = useCallback(
    async ({ accessToken }: { user: { id: string; email: string | null }; accessToken: string }) => {
      setIsOpen(false);
      await checkMigrationCandidate(accessToken);
      router.replace("/");
    },
    [checkMigrationCandidate, router],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = window.sessionStorage.getItem(AUTH_MIGRATION_CHECK_KEY);
    if (!pending) return;

    const runPendingCheck = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (accessToken) {
          await checkMigrationCandidate(accessToken);
        }
      } finally {
        window.sessionStorage.removeItem(AUTH_MIGRATION_CHECK_KEY);
      }
    };

    void runPendingCheck();
  }, [checkMigrationCandidate, supabase]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <GuestMigrationModal
        isOpen={isPromptOpen}
        isUploading={isUploading}
        error={error}
        onConfirm={confirmMigration}
        onDecline={declineMigration}
      />
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        onSignedIn={handleSignedIn}
        migrationCheckKey={AUTH_MIGRATION_CHECK_KEY}
      />
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
};
