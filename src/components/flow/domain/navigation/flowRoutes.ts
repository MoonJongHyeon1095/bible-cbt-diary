export const flowRoutes = {
  root: () => "/flow/list",
  byFlow: (flowId: number) => `/flow/detail?flowId=${flowId}`,
  byFlowAndNote: (flowId: number, noteId: number) =>
    `/flow/detail?flowId=${flowId}&noteId=${noteId}`,
  detail: (noteId: number) => `/detail?id=${noteId}`,
  deepSession: (mainId: number, flowId: number) =>
    `/session/deep?mainId=${mainId}&flowId=${flowId}`,
};
