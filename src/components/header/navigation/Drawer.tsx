"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useModalOpen } from "@/components/common/useModalOpen";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number;
  children: React.ReactNode;
};

const ANIM_MS = 220;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Drawer({
  open,
  onClose,
  side = "left",
  width = 340,
  children,
}: DrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const closeTimer = useRef<number | null>(null);

  useModalOpen(mounted);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setMounted(false);
    }, ANIM_MS);

    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, onClose]);

  const [vw, setVw] = useState<number>(() =>
    typeof window === "undefined" ? 1200 : window.innerWidth,
  );

  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const drawerW = useMemo(() => {
    const candidate = Math.round(vw * 0.86);
    return Math.min(width, candidate);
  }, [vw, width]);

  if (!mounted) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(8, 10, 14, 0.68)",
    zIndex: 10000,
    opacity: visible ? 1 : 0,
    transition: `opacity ${ANIM_MS}ms ease`,
  };

  const baseDrawerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    bottom: 0,
    width: drawerW,
    background: "linear-gradient(180deg, #0f131a, #0b0e13)",
    color: "#e7ebf2",
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    zIndex: 10001,
    transition: `transform ${ANIM_MS}ms ease`,
    display: "flex",
    flexDirection: "column",
    willChange: "transform",
    borderRight: "1px solid rgba(255,255,255,0.08)",
  };

  const translateHidden =
    side === "left" ? "translateX(-100%)" : "translateX(100%)";

  const drawerStyle: React.CSSProperties = {
    ...baseDrawerStyle,
    ...(side === "left" ? { left: 0 } : { right: 0 }),
    transform: visible ? "translateX(0)" : translateHidden,
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} aria-hidden="true" />
      <div
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}
