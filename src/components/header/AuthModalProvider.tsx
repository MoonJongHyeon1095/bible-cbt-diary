"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/header/AuthModal";
import GuestMigrationModal from "@/components/header/GuestMigrationModal";
import { useGuestMigration } from "@/lib/hooks/useGuestMigration";

type AuthModalContextValue = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    isPromptOpen,
    isUploading,
    error,
    confirmMigration,
    declineMigration,
  } = useGuestMigration();

  const openAuthModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignedIn = useCallback(() => {
    setIsOpen(false);
    router.replace("/");
  }, [router]);

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
