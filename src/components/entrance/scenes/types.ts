export type EntranceScene = {
  id: "1-1" | "1-2" | "1-3" | "1-3b" | "1-4a" | "1-4b" | "1-4c";
  narration: string;
  selectedNodeId: string | null;
  visibleNodeIds: string[];
  highlightNodeId: string | null;
  camera: "center" | "overview" | "none";
  showGoDeeper: boolean;
};
