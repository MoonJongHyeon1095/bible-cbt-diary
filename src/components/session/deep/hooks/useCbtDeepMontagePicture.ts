import { createDeepMontagePicture } from "@/lib/ai";
import { saveDeepMontageAPI } from "@/lib/api/session/postDeepMontage";
import type { DeepMontagePicture } from "@/lib/gpt/deepMontagePicture";
import type { DeepMontageScenario } from "@/lib/gpt/deepMontageScenario";
import { queryKeys } from "@/lib/queryKeys";
import type { AccessContext } from "@/lib/types/access";
import { startPerf } from "@/lib/utils/perf";
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useCbtDeepMontagePicture(
  scenario: DeepMontageScenario | null,
  options?: {
    enabled?: boolean;
    key?: string;
    save?: {
      access: AccessContext;
      flowId: number | null;
      mainNoteId: number;
      subNoteIds: number[];
    };
  },
) {
  const enabled = options?.enabled ?? true;
  const key = options?.key ?? "";
  const save = options?.save;
  const isDev = process.env.NODE_ENV !== "production";

  const query = useQuery({
    queryKey: queryKeys.ai.deepMontagePicture(key),
    queryFn: async () => {
      if (!scenario) {
        return null as DeepMontagePicture | null;
      }
      if (isDev) {
        console.info("[deep/montage-picture] query:start", {
          key,
          enabled,
        });
      }
      const endPerf = startPerf("deep:montagePicture");
      try {
        const result = await createDeepMontagePicture(scenario);
        if (isDev) {
          console.info("[deep/montage-picture] query:success", {
            key,
            hasResult: Boolean(result),
          });
        }
        return result;
      } finally {
        endPerf();
      }
    },
    enabled: Boolean(enabled && scenario),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (args: {
      access: AccessContext;
      payload: {
        flow_id: number | null;
        main_note_id: number;
        sub_note_ids: number[];
        atoms_jsonb: unknown[];
        montage_caption: string;
        montage_jsonb: {
          sequenceText: unknown[];
          cutLogicText: unknown[];
        };
        freeze_frames_jsonb: unknown[];
      };
    }) => saveDeepMontageAPI(args.access, args.payload),
  });

  const savedKeysRef = useRef(new Set<string>());
  const inflightKeysRef = useRef(new Set<string>());

  const saveSignature = useMemo(() => {
    if (!save) return "";
    return [
      save.access.mode,
      save.access.accessToken ?? "",
      save.flowId ?? "null",
      save.mainNoteId,
      save.subNoteIds.join("|"),
    ].join(":");
  }, [save]);

  useEffect(() => {
    if (!save || !key) return;
    if (!query.data) return;
    if (!Number.isFinite(save.flowId ?? NaN)) return;
    if (savedKeysRef.current.has(key) || inflightKeysRef.current.has(key)) return;

    inflightKeysRef.current.add(key);
    if (isDev) {
      console.info("[deep/montage-picture] save:start", {
        key,
        flowId: save.flowId,
        mainNoteId: save.mainNoteId,
        subNoteIds: save.subNoteIds,
      });
    }

    const payload = {
      flow_id: save.flowId,
      main_note_id: save.mainNoteId,
      sub_note_ids: save.subNoteIds,
      atoms_jsonb: query.data.atomsText,
      montage_caption: query.data.montageText.caption,
      montage_jsonb: {
        sequenceText: query.data.montageText.sequenceText,
        cutLogicText: query.data.montageText.cutLogicText,
      },
      freeze_frames_jsonb: query.data.freezeFramesText,
    };

    saveMutation
      .mutateAsync({ access: save.access, payload })
      .then((result) => {
        if (result.ok) {
          savedKeysRef.current.add(key);
          if (isDev) {
            console.info("[deep/montage-picture] save:success", { key });
          }
        }
      })
      .catch((error) => {
        if (isDev) {
          console.warn("[deep/montage-picture] save:error", {
            key,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      })
      .finally(() => {
        inflightKeysRef.current.delete(key);
      });
  }, [
    isDev,
    key,
    query.data,
    save,
    saveSignature,
    saveMutation,
  ]);

  return {
    picture: query.data ?? null,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "오류가 발생했습니다."
      : null,
    loading: query.isPending || query.isFetching,
    saveError: saveMutation.isError
      ? saveMutation.error instanceof Error
        ? saveMutation.error.message
        : "저장 중 오류가 발생했습니다."
      : null,
  };
}
