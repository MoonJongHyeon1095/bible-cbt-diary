import { queryKeys } from "@/lib/queryKeys";
import { flushTokenSessionUsage } from "@/lib/storage/token/sessionUsage";
import { clearCbtSessionStorage } from "@/lib/storage/session/cbtSessionStorage";

type QueryClientLike = {
  invalidateQueries: (args: { queryKey: readonly unknown[] }) => Promise<unknown>;
};

type RouterLike = {
  replace: (path: string) => void;
};

type RunSessionSavePostProcessParams = {
  queryClient: QueryClientLike;
  router: RouterLike;
  nextPath: string;
  pushToast: (message: string, type: "success" | "error") => void;
  includeFlowQuery?: boolean;
};

export async function runSessionSavePostProcess({
  queryClient,
  router,
  nextPath,
  pushToast,
  includeFlowQuery = false,
}: RunSessionSavePostProcessParams) {
  pushToast("세션 기록이 저장되었습니다.", "success");
  void queryClient.invalidateQueries({
    queryKey: queryKeys.emotionNotes.all,
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.sessionHistory.all,
  });
  if (includeFlowQuery) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.flow.all,
    });
  }

  try {
    void flushTokenSessionUsage({ sessionCount: 1 });
    clearCbtSessionStorage();
    router.replace(nextPath);
    return true;
  } catch (navigationError) {
    console.error("세션 이동 실패:", navigationError);
    pushToast("세션 이동 중 문제가 발생했습니다.", "error");
    return false;
  }
}
