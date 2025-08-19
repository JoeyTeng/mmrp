import { useReactFlow, Node, Edge, getConnectedEdges } from "@xyflow/react";
import { NodeAction } from "./NodeContextMenuConfig";
import { useCallback } from "react";
import { ModuleData, ModuleType } from "@/types/module";
import { usePipelineExport } from "@/components/sidebar/util";

export const useNodeActions = (
  onEditNode: (node: Node<ModuleData, ModuleType>) => void,
) => {
  const {
    addEdges,
    addNodes,
    getEdges,
    getNode,
    getNodesBounds,
    deleteElements,
  } = useReactFlow();
  const { handleExportPipeline } = usePipelineExport();

  const getFilteredNodes = useCallback(
    (nodeIds: string[]): Node[] => {
      return nodeIds.map((nodeId) => getNode(nodeId)).filter((node) => !!node);
    },
    [getNode],
  );

  const duplicateNodes = useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length === 0) return;

      const nodes = getFilteredNodes(nodeIds);
      if (nodes.length === 0) return;

      const uniqueNodeIds = new Set([...nodes].map((node) => node.id));
      const nodeIdsMap = new Map<string, string>();
      const boundingBox = getNodesBounds(nodes);
      const edges = getConnectedEdges(nodes, getEdges()).filter(
        (edge) =>
          uniqueNodeIds.has(edge.source) && uniqueNodeIds.has(edge.target),
      );

      const duplicatedNodes: Node[] = [];
      nodes.forEach((node) => {
        const newId = crypto.randomUUID();
        nodeIdsMap.set(node.id, newId);
        duplicatedNodes.push({
          id: newId,
          data: { ...node.data },
          type: node.type,
          selected: false,
          dragging: false,
          position: {
            ...node.position,
            y: node.position.y + boundingBox.height + 20,
          },
          sourcePosition: node.sourcePosition,
          targetPosition: node.targetPosition,
        });
      });

      const duplicatedEdges: Edge[] = edges.map((edge) => ({
        ...edge,
        id: crypto.randomUUID(),
        source: nodeIdsMap.get(edge.source)!,
        target: nodeIdsMap.get(edge.target)!,
        selected: false,
      }));

      addNodes(duplicatedNodes);
      addEdges(duplicatedEdges);
      return;
    },
    [addEdges, addNodes, getEdges, getFilteredNodes, getNodesBounds],
  );

  const exportNodes = useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length === 0) return;

      const nodes = getFilteredNodes(nodeIds);
      if (nodes.length === 0) return;

      handleExportPipeline({
        nodes: nodes,
        filename: nodes.length > 1 ? "modules" : "module",
      });
    },
    [getFilteredNodes, handleExportPipeline],
  );

  const handleNodeAction = useCallback(
    (action: NodeAction, nodeIds: string[]) => {
      switch (action) {
        case "duplicate": {
          duplicateNodes(nodeIds);
          return;
        }
        case "configure": {
          if (nodeIds.length > 1) return;
          const node = getNode(nodeIds[0]) as Node<ModuleData, ModuleType>;
          if (node) onEditNode(node);
          return;
        }
        case "export": {
          exportNodes(nodeIds);
          return;
        }
        case "delete": {
          deleteElements({ nodes: getFilteredNodes(nodeIds) });
          return;
        }
        default:
          return;
      }
    },
    [
      deleteElements,
      duplicateNodes,
      exportNodes,
      getFilteredNodes,
      getNode,
      onEditNode,
    ],
  );

  return { handleNodeAction };
};
