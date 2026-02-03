"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import styles from "./Notice.module.css";

const APP_STORE_ID = process.env.NEXT_PUBLIC_APP_STORE_ID;

export default function AppUpdateGate() {
  const [requiresUpdate, setRequiresUpdate] = useState(false);
  const [storeLabel, setStoreLabel] = useState("업데이트하기");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    if (checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    let active = true;

    const checkForUpdates = async () => {
      try {
        const { AppUpdate, AppUpdateAvailability } = await import(
          "@capawesome/capacitor-app-update"
        );
        const platform = Capacitor.getPlatform();
        const info = await AppUpdate.getAppUpdateInfo();
        if (!active) return;

        const updateAvailable =
          info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE ||
          info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;

        if (!updateAvailable) {
          return;
        }

        if (platform === "android" && info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
          return;
        }

        setStoreLabel(platform === "android" ? "Play 스토어로 이동" : "App Store로 이동");
        setRequiresUpdate(true);
      } catch (error) {
        console.log("[app-update] check failed:", error);
      }
    };

    checkForUpdates();

    return () => {
      active = false;
    };
  }, []);

  if (!requiresUpdate) return null;

  const handleOpenStore = async () => {
    try {
      const { AppUpdate } = await import("@capawesome/capacitor-app-update");
      const platform = Capacitor.getPlatform();
      if (platform === "ios" && APP_STORE_ID) {
        await AppUpdate.openAppStore({ appId: APP_STORE_ID });
        return;
      }
      await AppUpdate.openAppStore();
    } catch (error) {
      console.log("[app-update] open store failed:", error);
    }
  };

  return (
    <div className={styles.noticeOverlay} role="dialog" aria-modal="true">
      <div className={styles.noticeCard}>
        <div className={`${styles.noticeBadge} ${styles.noticeCritical}`}>
          업데이트 필요
        </div>
        <h2 className={styles.noticeTitle}>새 버전으로 업데이트해주세요</h2>
        <div className={styles.noticeBody}>
          <p className={styles.noticeParagraph}>
            최신 버전에서 안정성과 기능이 개선되었습니다. 업데이트 후 계속 이용할 수
            있어요.
          </p>
        </div>
        <div className={styles.noticeActions}>
          <button
            type="button"
            className={`${styles.noticeButton} ${styles.noticeButtonPrimary}`}
            onClick={handleOpenStore}
          >
            {storeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
