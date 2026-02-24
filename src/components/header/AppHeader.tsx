"use client";

import AppTabs from "@/components/tab/AppTabs";
import SafeButton from "@/components/ui/SafeButton";
import { useAuthModal } from "@/components/header/AuthModalProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearAiUsageGuardCache } from "@/lib/storage/ai-usage/cache";
import { clearTokenSessionStorage } from "@/lib/storage/token/sessionUsage";
import { safeSessionStorage } from "@/lib/storage/core/safeStorage";
import { DISCLAIMER_BANNER_DISMISS_KEY } from "@/lib/storage/keys/ui";
import { House, LogIn, LogOut, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./AppHeader.module.css";
import CompactNav from "./navigation/CompactNav";
import DisclaimerBanner from "./DisclaimerBanner";

type SessionUser = {
  id: string;
  email: string | null;
};

type AppHeaderProps = {
  showDisclaimer?: boolean;
  preserveDisclaimerGap?: boolean;
  variant?: "default" | "session";
  sessionNav?: {
    canGoBack: boolean;
    onBack: () => void;
    onHome: () => void;
  };
};

export default function AppHeader({
  showDisclaimer = true,
  preserveDisclaimerGap = false,
  variant = "default",
  sessionNav,
}: AppHeaderProps) {
  if (variant === "session") {
    return <SessionAppHeader sessionNav={sessionNav} />;
  }

  return (
    <DefaultAppHeader
      showDisclaimer={showDisclaimer}
      preserveDisclaimerGap={preserveDisclaimerGap}
    />
  );
}

function SessionAppHeader({
  sessionNav,
}: Pick<AppHeaderProps, "sessionNav">) {
  return (
    <>
      <div className={styles.sessionSafeTopInset} aria-hidden />
      {sessionNav?.canGoBack ? (
        <div className={`${styles.sessionFloatingNav} ${styles.sessionLeft}`}>
          <SafeButton
            type="button"
            variant="unstyled"
            onClick={sessionNav.onBack}
            aria-label="이전으로"
            className={styles.sessionFloatingMiniButton}
          >
            <Undo2
              className={styles.sessionFloatingMiniIcon}
              strokeWidth={2.2}
              absoluteStrokeWidth
            />
          </SafeButton>
        </div>
      ) : null}
      <div className={`${styles.sessionFloatingNav} ${styles.sessionRight}`}>
        <SafeButton
          type="button"
          variant="unstyled"
          onClick={sessionNav?.onHome}
          aria-label="홈으로"
          className={styles.sessionFloatingMiniButton}
        >
          <House
            className={styles.sessionFloatingMiniIcon}
            strokeWidth={2.2}
            absoluteStrokeWidth
          />
        </SafeButton>
      </div>
    </>
  );
}

function DefaultAppHeader({
  showDisclaimer,
  preserveDisclaimerGap,
}: Pick<AppHeaderProps, "showDisclaimer" | "preserveDisclaimerGap">) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState<boolean | null>(
    null,
  );
  const { openAuthModal } = useAuthModal();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    setIsDisclaimerVisible(
      safeSessionStorage.getItem(DISCLAIMER_BANNER_DISMISS_KEY) !== "true",
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(
        data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
      );
      setIsAuthResolved(true);
    };
    void loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(
          session?.user
            ? { id: session.user.id, email: session.user.email ?? null }
            : null,
        );
        setIsAuthResolved(true);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    clearAiUsageGuardCache();
    clearTokenSessionStorage();
  };

  const handleDismissDisclaimer = () => {
    safeSessionStorage.setItem(DISCLAIMER_BANNER_DISMISS_KEY, "true");
    setIsDisclaimerVisible(false);
  };

  const shouldRenderDisclaimerWrap =
    showDisclaimer &&
    (isDisclaimerVisible === null
      ? true
      : isDisclaimerVisible || preserveDisclaimerGap);

  return (
    <>
      <div className={styles.mobileSafeTopInset} aria-hidden />
      <header className={styles.header}>
        <div className={styles.logoSlot}>
          <CompactNav userEmail={user?.email ?? null} />
        </div>
        <div className={styles.tabsSlot}>
          <AppTabs />
        </div>
        <div className={styles.actions}>
          {!isAuthResolved ? null : user ? (
            <div className={styles.userBox}>
              <SafeButton
                type="button"
                variant="unstyled"
                className={styles.iconButton}
                onClick={handleSignOut}
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut
                  size={18}
                  strokeWidth={2.2}
                  absoluteStrokeWidth
                  className={styles.headerActionIcon}
                />
              </SafeButton>
            </div>
          ) : (
            <SafeButton
              type="button"
              variant="unstyled"
              className={styles.loginButton}
              onClick={() => openAuthModal()}
            >
              <LogIn
                size={18}
                strokeWidth={2.2}
                absoluteStrokeWidth
                className={styles.headerActionIcon}
              />
              로그인
            </SafeButton>
          )}
        </div>
      </header>
      {shouldRenderDisclaimerWrap ? (
        <div className={styles.disclaimerWrap}>
          {isDisclaimerVisible ? (
            <DisclaimerBanner
              detailsClassName={styles.disclaimerDetails}
              titleClassName={styles.disclaimerTitle}
              textClassName={styles.disclaimerText}
              onDismiss={handleDismissDisclaimer}
            />
          ) : (
            <div className={styles.disclaimerPlaceholder} aria-hidden />
          )}
        </div>
      ) : null}
    </>
  );
}
