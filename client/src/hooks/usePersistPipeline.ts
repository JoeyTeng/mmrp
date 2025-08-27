import { useEffect, useMemo } from "react";
import { Node, Edge } from "@xyflow/react";
import { ModuleData, ModuleType } from "@/types/module";

const STORAGE_KEY = "pipeline";

export function usePersistPipeline(
  getNodes: () => Node<ModuleData, ModuleType>[],
  getEdges: () => Edge[],
  defaultNodes: Node<ModuleData, ModuleType>[],
  defaultEdges: Edge[],
) {
  // Only store the initial values
  const persistedNodes = useMemo<Node<ModuleData, ModuleType>[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).nodes ?? defaultNodes;
      } catch {}
    }
    return defaultNodes;
  }, [defaultNodes]);

  const persistedEdges = useMemo<Edge[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).edges ?? defaultEdges;
      } catch {}
    }
    return defaultEdges;
  }, [defaultEdges]);

  // Persist on visibility change or before unload
  useEffect(() => {
    const handleSave = () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nodes: getNodes(), edges: getEdges() }),
      );
    };
    window.addEventListener("beforeunload", handleSave);
    document.addEventListener("visibilitychange", handleSave);
    return () => {
      handleSave();
      window.removeEventListener("beforeunload", handleSave);
      document.removeEventListener("visibilitychange", handleSave);
    };
  }, [getNodes, getEdges]);

  return { persistedNodes, persistedEdges };
}
