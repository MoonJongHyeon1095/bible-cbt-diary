"use client";

import AppHeader from "@/components/header/AppHeader";
import {
  GUEST_DAILY_LIMIT,
  GUEST_MONTHLY_LIMIT,
  MEMBER_DAILY_LIMIT,
  MEMBER_MONTHLY_LIMIT,
} from "@/lib/utils/aiUsageGuard";
import { fetchTokenUsageStatus } from "@/lib/api/token-usage/getTokenUsageStatus";
import { useMemo } from "react";
import styles from "./UsagePage.module.css";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getDeviceId } from "@/lib/utils/deviceId";

type UsageState = {
  daily: number;
  monthly: number;
  isMember: boolean;
};

const formatPercent = (value: number) =>
  `${Math.round(value * 100).toLocaleString("ko-KR")}%`;

export default function UsagePage() {
  const deviceId = getDeviceId();
  const usageQuery = useQuery({
    queryKey: queryKeys.tokenUsage.byDevice(deviceId),
    queryFn: fetchTokenUsageStatus,
    staleTime: 60_000,
  });

  const state: UsageState | null = useMemo(
    () =>
      usageQuery.data
        ? {
            daily: usageQuery.data.usage.daily_usage,
            monthly: usageQuery.data.usage.monthly_usage,
            isMember: usageQuery.data.is_member,
          }
        : null,
    [usageQuery.data],
  );

  const error = usageQuery.isError
    ? "사용량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    : null;

  const limits = useMemo(() => {
    if (!state) {
      return {
        daily: GUEST_DAILY_LIMIT,
        monthly: GUEST_MONTHLY_LIMIT,
        isMember: false,
      };
    }
    return {
      daily: state.isMember ? MEMBER_DAILY_LIMIT : GUEST_DAILY_LIMIT,
      monthly: state.isMember ? MEMBER_MONTHLY_LIMIT : GUEST_MONTHLY_LIMIT,
      isMember: state.isMember,
    };
  }, [state]);

  const dailyPercent = state ? Math.min(state.daily / limits.daily, 1) : 0;
  const monthlyPercent = state
    ? Math.min(state.monthly / limits.monthly, 1)
    : 0;

  const dailyWarn = dailyPercent >= 0.9;
  const monthlyWarn = monthlyPercent >= 0.9;

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <span className={styles.badge}>
              {limits.isMember ? "회원 기준" : "게스트 기준"}
            </span>
            <h1 className={styles.title}>AI 사용량</h1>
            <p className={styles.subtitle}>
              로그인 사용자는 더 넉넉한 사용량이 제공됩니다.
            </p>
          </header>

          {error ? <div className={styles.error}>{error}</div> : null}

          <div className={styles.cardsWrap}>
            {!state ? (
              <div className={styles.loadingCard}>사용량을 불러오는 중...</div>
            ) : (
              <div className={styles.grid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>오늘 사용량</h2>
                  </div>
                  <div className={styles.gaugeTrack}>
                    <div
                      className={`${styles.gaugeFill} ${
                        dailyWarn ? styles.gaugeWarn : ""
                      }`}
                      style={{ width: `${dailyPercent * 100}%` }}
                    />
                  </div>
                  <div className={styles.numbers}>
                    <div className={styles.usageValue}>
                      {formatPercent(dailyPercent)}
                    </div>
                    <div className={styles.usageLimit}>/ 100%</div>
                  </div>
                  <p className={styles.hint}>
                    일일 사용량은 매일 KST 09:00 초기화 됩니다.
                  </p>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>이번 달 사용량</h2>
                  </div>
                  <div className={styles.gaugeTrack}>
                    <div
                      className={`${styles.gaugeFill} ${
                        monthlyWarn ? styles.gaugeWarn : ""
                      }`}
                      style={{ width: `${monthlyPercent * 100}%` }}
                    />
                  </div>
                  <div className={styles.numbers}>
                    <div className={styles.usageValue}>
                      {formatPercent(monthlyPercent)}
                    </div>
                    <div className={styles.usageLimit}>/ 100%</div>
                  </div>
                  <p className={styles.hint}>
                    월간 사용량은 매월 1일 KST 09:00 초기화 됩니다.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
