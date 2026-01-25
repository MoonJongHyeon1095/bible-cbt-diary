"use client";

import { getOAuthRedirectTo } from "@/lib/auth/oauth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { useModalOpen } from "@/components/common/useModalOpen";
import { Lock, LogIn, Mail, User, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

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

  if (!isOpen) {
    return null;
  }

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

  const handleOAuth = async (provider: "google") => {
    setIsSubmitting(true);
    setMessage("");
    setError("");
    const redirectTo = getOAuthRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setError("소셜 로그인을 시작하지 못했습니다.");
    }
  };

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
          <Button
            type="button"
            variant="unstyled"
            className={styles.close}
            onClick={onClose}
          >
            닫기
          </Button>
        </header>

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
          <Button
            type="submit"
            variant="unstyled"
            className={styles.primaryButton}
            loading={isSubmitting}
            loadingText="처리 중..."
            disabled={isSubmitting}
          >
            {mode === "signin" ? "로그인" : "회원가입"}
          </Button>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>또는</span>
            <span className={styles.dividerLine} />
          </div>

          <Button
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
          </Button>

          <div className={styles.switchRow}>
            {mode === "signin" ? (
              <span>
                계정이 없으신가요?{" "}
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setMode("signup")}
                  className={styles.switchButton}
                >
                  회원가입
                </Button>
              </span>
            ) : (
              <span>
                이미 계정이 있으신가요?{" "}
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => setMode("signin")}
                  className={styles.switchButton}
                >
                  로그인
                </Button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
