"use client";

import { useMemo, useState } from "react";
import { getOAuthRedirectTo } from "@/lib/auth/oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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

export default function AuthModal({ isOpen, onClose, onSignedIn }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  if (!isOpen) {
    return null;
  }

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsSubmitting(false);

      if (error || !data.user) {
        setMessage("로그인에 실패했습니다.");
        return;
      }

      onSignedIn({ id: data.user.id, email: data.user.email ?? null });
      onClose();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setIsSubmitting(false);

    if (error) {
      setMessage("회원가입에 실패했습니다.");
      return;
    }

    if (data.user && data.session) {
      onSignedIn({ id: data.user.id, email: data.user.email ?? null });
      onClose();
      return;
    }

    setMessage("가입 확인 이메일을 보냈습니다.");
  };

  const handleOAuth = async (provider: "google") => {
    setIsSubmitting(true);
    setMessage("");
    const redirectTo = getOAuthRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setMessage("소셜 로그인을 시작하지 못했습니다.");
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <p className={styles.label}>계정</p>
            <h2 className={styles.title}>
              {mode === "signin" ? "로그인" : "회원가입"}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            닫기
          </button>
        </header>

        <div className={styles.tabRow}>
          <button
            type="button"
            className={mode === "signin" ? styles.tabActive : styles.tab}
            onClick={() => setMode("signin")}
          >
            로그인
          </button>
          <button
            type="button"
            className={mode === "signup" ? styles.tabActive : styles.tab}
            onClick={() => setMode("signup")}
          >
            회원가입
          </button>
        </div>

        <form className={styles.form} onSubmit={handleAuthSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이메일</span>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>비밀번호</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
            />
          </label>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting}
          >
            {mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className={styles.divider}>또는</div>

        <div className={styles.socialRow}>
          <button
            type="button"
            className={styles.socialButton}
            onClick={() => handleOAuth("google")}
            disabled={isSubmitting}
          >
            <span className={styles.socialIcon} aria-hidden>
              G
            </span>
            Google로 계속하기
          </button>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}
      </div>
    </div>
  );
}
