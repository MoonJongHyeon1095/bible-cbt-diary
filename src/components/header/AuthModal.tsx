"use client";

import { getOAuthRedirectTo } from "@/lib/auth/oauth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SafeButton from "@/components/ui/SafeButton";
import { useModalOpen } from "@/components/common/useModalOpen";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Lock, LogIn, Mail, User, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./AuthModal.module.css";

type SessionUser = {
  id: string;
  email: string | null;
};

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn: (user: SessionUser) => void;
};

const isInAppBrowserUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  const inAppHints = [
    "fban",
    "fbav",
    "instagram",
    "threads",
    "kakaotalk",
    "kakao",
    "line",
    "naver",
    "daum",
    "zalo",
  ];
  if (inAppHints.some((hint) => ua.includes(hint))) {
    return true;
  }
  const isAndroidWebView = ua.includes("; wv") || ua.includes(" wv)");
  const isIosWebView =
    /iphone|ipad|ipod/.test(ua) && ua.includes("applewebkit") && !ua.includes("safari");
  return isAndroidWebView || isIosWebView;
};

// 앱이 WebView여도 네이티브에서는 OAuth를 시스템 브라우저로 열 수 있으므로
// "인앱 브라우저 차단 대상"에서 제외한다.
const isBlockedInAppBrowser = (
  userAgent: string,
  isNativePlatform: boolean,
) => {
  if (isNativePlatform) {
    return false;
  }
  return isInAppBrowserUserAgent(userAgent);
};

export default function AuthModal({
  isOpen,
  onClose,
  onSignedIn,
}: AuthModalProps) {
  useModalOpen(isOpen);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [hasTriedExternalOpen, setHasTriedExternalOpen] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        return;
      }
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED") {
        return;
      }

      onSignedIn({ id: session.user.id, email: session.user.email ?? null });
      onClose();
    });

    return () => data.subscription.unsubscribe();
  }, [isOpen, onClose, onSignedIn, supabase]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    setCurrentUrl(window.location.href);
    const ua = window.navigator?.userAgent ?? "";
    setIsInAppBrowser(isBlockedInAppBrowser(ua, isNativePlatform));
  }, [isOpen, isNativePlatform]);

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsSubmitting(false);

      if (error || !data.user) {
        setError("로그인에 실패했습니다.");
        return;
      }

      onSignedIn({ id: data.user.id, email: data.user.email ?? null });
      onClose();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { name } } : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setError("회원가입에 실패했습니다.");
      return;
    }

    if (data.user && data.session) {
      onSignedIn({ id: data.user.id, email: data.user.email ?? null });
      onClose();
      return;
    }

    setMessage("회원가입이 완료되었습니다. 로그인해주세요.");
    setMode("signin");
  };

  const handleOAuth = async (provider: "google" | "apple" | "facebook") => {
    setIsSubmitting(true);
    setMessage("");
    setError("");
    const redirectTo = getOAuthRedirectTo();
    if (isNativePlatform) {
      // 네이티브 앱에서는 OAuth URL만 받아 시스템 브라우저로 연다.
      // iOS: ASWebAuthenticationSession / Android: Chrome Custom Tabs
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          ...(redirectTo ? { redirectTo } : {}),
          skipBrowserRedirect: true,
        },
      });

      if (!error && data?.url) {
        await Browser.open({
          url: data.url,
          presentationStyle: "fullscreen",
        });
      }

      setIsSubmitting(false);

      if (error || !data?.url) {
        setError("소셜 로그인을 시작하지 못했습니다.");
      }
      return;
    }

    if (isInAppBrowser) {
      // 외부 앱 인앱 브라우저에서는 OAuth 차단 가능성이 높아
      // 브라우저 전환만 시도하고 로그인 흐름은 중단한다.
      handleOpenExternalBrowser();
      setIsSubmitting(false);
      setError("인앱 브라우저에서는 로그인이 막힐 수 있어요.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setError("소셜 로그인을 시작하지 못했습니다.");
    }
  };

  const handleOpenExternalBrowser = useCallback(() => {
    if (!currentUrl || typeof window === "undefined") {
      return;
    }

    const opened = window.open(currentUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = currentUrl;
    }
  }, [currentUrl]);

  useEffect(() => {
    if (!isOpen || !isInAppBrowser || isNativePlatform || hasTriedExternalOpen) {
      return;
    }
    if (!currentUrl) {
      return;
    }

    // Threads/인스타/카톡 등 인앱 브라우저에서 열리면
    // Google OAuth가 막히는 경우가 많아 1회 외부 브라우저로 유도한다.
    setHasTriedExternalOpen(true);
    const timer = window.setTimeout(() => {
      handleOpenExternalBrowser();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    isOpen,
    isInAppBrowser,
    isNativePlatform,
    hasTriedExternalOpen,
    currentUrl,
    handleOpenExternalBrowser,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <div className={styles.headerTitle}>
              {mode === "signin" ? (
                <>
                  <LogIn size={20} />
                  로그인
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  회원가입
                </>
              )}
            </div>
          </div>
          <SafeButton
            type="button"
            variant="unstyled"
            className={styles.close}
            onClick={onClose}
          >
            닫기
          </SafeButton>
        </header>
        {/*
          인앱 브라우저 안내 박스는 제거됨.
          (인앱 감지 시 자동 외부 브라우저 유도는 유지)
        */}

        <form className={styles.form} onSubmit={handleAuthSubmit}>
          {mode === "signup" ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                <User size={16} />
                이름
              </span>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홍길동"
                className={styles.input}
              />
            </label>
          ) : null}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <Mail size={16} />
              이메일
            </span>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <Lock size={16} />
              비밀번호
            </span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={styles.input}
            />
            {mode === "signup" ? (
              <span className={styles.helperText}>최소 6자 이상</span>
            ) : null}
          </label>
          {error ? (
            <div className={styles.errorBox}>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : null}
          {message ? <p className={styles.message}>{message}</p> : null}
          <SafeButton
            type="submit"
            variant="unstyled"
            className={styles.primaryButton}
            loading={isSubmitting}
            loadingText="처리 중..."
            disabled={isSubmitting}
          >
            {mode === "signin" ? "로그인" : "회원가입"}
          </SafeButton>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>또는</span>
            <span className={styles.dividerLine} />
          </div>

          <SafeButton
            type="button"
            variant="unstyled"
            className={styles.socialButton}
            onClick={() => handleOAuth("google")}
            loading={isSubmitting}
            loadingText="연결 중..."
            disabled={isSubmitting}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </SafeButton>
          <SafeButton
            type="button"
            variant="unstyled"
            className={`${styles.socialButton} ${styles.appleButton}`}
            onClick={() => handleOAuth("apple")}
            loading={isSubmitting}
            loadingText="연결 중..."
            disabled={isSubmitting}
          >
            <svg className={styles.appleIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16.37 1.5c0 1-.41 1.95-1.1 2.67-.79.81-2.08 1.44-3.17 1.36-.14-1.07.38-2.17 1.11-2.9.79-.8 2.13-1.39 3.16-1.13zM20.89 17.1c-.63 1.42-1.4 2.75-2.53 4.01-1.06 1.18-1.93 1.98-3.47 2-1.5.02-1.98-.98-3.7-.98-1.73 0-2.25.95-3.68 1-1.48.06-2.63-.96-3.7-2.14-2.04-2.23-3.6-6.29-1.51-9.03.99-1.31 2.75-2.14 4.64-2.18 1.45-.03 2.81.99 3.69.99.86 0 2.49-1.22 4.2-1.04.72.03 2.72.29 4 2.2-.1.07-2.39 1.4-2.36 4.18.04 3.34 2.94 4.46 2.97 4.47-.02.08-.47 1.6-1.55 3.52z"
              />
            </svg>
            Apple로 계속하기
          </SafeButton>
          <SafeButton
            type="button"
            variant="unstyled"
            className={`${styles.socialButton} ${styles.facebookButton}`}
            onClick={() => handleOAuth("facebook")}
            loading={isSubmitting}
            loadingText="연결 중..."
            disabled={isSubmitting}
          >
            <svg className={styles.facebookIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M13.5 9.24V7.5c0-.83.68-1.5 1.5-1.5h1.5V3h-1.5C12.02 3 10 5.02 10 7.5v1.74H8v3h2v7.5h3V12.24h2.25l.75-3H13.5z"
              />
            </svg>
            Facebook으로 계속하기
          </SafeButton>

          <div className={styles.switchRow}>
            {mode === "signin" ? (
              <span>
                계정이 없으신가요?{" "}
                <SafeButton
                  type="button"
                  variant="unstyled"
                  onClick={() => setMode("signup")}
                  className={styles.switchButton}
                >
                  회원가입
                </SafeButton>
              </span>
            ) : (
              <span>
                이미 계정이 있으신가요?{" "}
                <SafeButton
                  type="button"
                  variant="unstyled"
                  onClick={() => setMode("signin")}
                  className={styles.switchButton}
                >
                  로그인
                </SafeButton>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
