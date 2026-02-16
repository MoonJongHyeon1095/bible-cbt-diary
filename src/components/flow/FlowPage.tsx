"use client";

import FlowListSection from "@/components/flow/list/FlowListSection";
import FlowDetailSection from "@/components/flow/detail/FlowDetailSection";
import AppHeader from "@/components/header/AppHeader";
import { useAccessContext } from "@/lib/hooks/useAccessContext";
import { Suspense, useMemo } from "react";
import styles from "@/app/page.module.css";
import flowStyles from "./FlowPage.module.css";
import { useFlowSearchParams } from "./hooks/useFlowSearchParams";

type FlowPageProps = {
  mode: "list" | "detail";
};

function FlowPageContent({ mode }: FlowPageProps) {
  const { accessMode, accessToken, isLoading } = useAccessContext();
  const { flowId, noteId } = useFlowSearchParams();

  const access = useMemo(
    () => ({ mode: accessMode, accessToken }),
    [accessMode, accessToken],
  );

  const mainClassName = `${styles.main} ${
    mode === "list"
      ? flowStyles.listMain
      : mode === "detail"
        ? flowStyles.detailMain
        : ""
  }`;
  const shellClassName = `${styles.shell} ${
    mode === "list"
      ? flowStyles.listShell
      : mode === "detail"
        ? flowStyles.detailShell
        : ""
  }`;

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={mainClassName}>
        <div className={shellClassName}>
          {isLoading ? null : accessMode !== "blocked" ? (
            mode === "detail" ? (
              <FlowDetailSection
                access={access}
                noteId={noteId}
                flowId={flowId}
              />
            ) : (
              <FlowListSection access={access} noteId={noteId} />
            )
          ) : (
            <div className={styles.emptyAuth}>로그인 후 플로우를 확인할 수 있어요.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FlowPage({ mode }: FlowPageProps) {
  const mainClassName = `${styles.main} ${
    mode === "list"
      ? flowStyles.listMain
      : mode === "detail"
        ? flowStyles.detailMain
        : ""
  }`;
  const shellClassName = `${styles.shell} ${
    mode === "list"
      ? flowStyles.listShell
      : mode === "detail"
        ? flowStyles.detailShell
        : ""
  }`;

  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <AppHeader />
          <main className={mainClassName}>
            <div className={shellClassName}>
              <div className={styles.emptyAuth}>플로우를 불러오는 중...</div>
            </div>
          </main>
        </div>
      }
    >
      <FlowPageContent mode={mode} />
    </Suspense>
  );
}
