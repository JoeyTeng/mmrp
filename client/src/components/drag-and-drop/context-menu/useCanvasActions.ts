import { useCallback, useContext } from "react";
import { CanvasContextAction } from "./CanvasContextMenuConfig";
import { useReactFlow } from "@xyflow/react";
import { usePipelineExport } from "@/components/sidebar/util";
import { SidebarContext } from "@/contexts/SidebarContext";

export const useCanvasActions = (onRun: () => void) => {
  const { getNodes, deleteElements } = useReactFlow();
  const { handleExportPipeline } = usePipelineExport();
  const sidebar = useContext(SidebarContext);
  const handleCanvasAction = useCallback(
    (action: CanvasContextAction) => {
      switch (action) {
        case "clear": {
          deleteElements({
            nodes: getNodes().map((node) => ({ id: node.id })),
          });
          return;
        }
        case "export":
          handleExportPipeline();
          return;
        case "run":
          onRun();
          return;
        case "add_node":
          if (sidebar?.leftOpenPanelId) return;
          sidebar?.setLeftOpenPanelId("modules");
          return;
        default:
          return;
      }
    },
    [deleteElements, getNodes, handleExportPipeline, onRun, sidebar],
  );

  const isEmpty = () => getNodes().length === 0;

  return { handleCanvasAction, isEmpty };
};
