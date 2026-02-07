import { createDeepMontagePicture } from "@/lib/ai";
import type { DeepMontagePicture } from "@/lib/gpt/deepMontagePicture";
import type { DeepMontageScenario } from "@/lib/gpt/deepMontageScenario";
import { queryKeys } from "@/lib/queryKeys";
import { startPerf } from "@/lib/utils/perf";
import { useQuery } from "@tanstack/react-query";

export function useCbtDeepMontagePicture(
  scenario: DeepMontageScenario | null,
  options?: { enabled?: boolean; key?: string },
) {
  const enabled = options?.enabled ?? true;
  const key = options?.key ?? "";

  const query = useQuery({
    queryKey: queryKeys.ai.deepMontagePicture(key),
    queryFn: async () => {
      if (!scenario) {
        return null as DeepMontagePicture | null;
      }
      const endPerf = startPerf("deep:montagePicture");
      try {
        return createDeepMontagePicture(scenario);
      } finally {
        endPerf();
      }
    },
    enabled: Boolean(enabled && scenario),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    picture: query.data ?? null,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "오류가 발생했습니다."
      : null,
    loading: query.isPending || query.isFetching,
  };
}
