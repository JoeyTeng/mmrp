"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import {
  ReactFlowProvider,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import {
  moduleRegistry,
  getInitialNodeParamValue,
} from "@/components/modules/modulesRegistry";

import { NodeData, NodeType } from "../drag-and-drop/types";

const initialNodes: Node<NodeData, NodeType>[] = [
  {
    id: "1",
    type: NodeType.InputNode,
    position: { x: 0, y: 100 },
    data: {
      label: "Source",
      params: getInitialNodeParamValue(moduleRegistry.Source.params),
    },
  },
  {
    id: "2",
    type: NodeType.ProcessNode,
    position: { x: 220, y: 100 },
    data: {
      label: "DownSample",
      params: getInitialNodeParamValue(moduleRegistry.DownSample.params),
    },
  },
  {
    id: "3",
    type: NodeType.ProcessNode,
    position: { x: 400, y: 100 },
    data: {
      label: "Denoise",
      params: getInitialNodeParamValue(moduleRegistry.Denoise.params),
    },
  },
  {
    id: "4",
    type: NodeType.OutputNode,
    position: { x: 600, y: 100 },
    data: {
      label: "Result",
      params: getInitialNodeParamValue(moduleRegistry.Result.params),
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
  },
];

const DragAndDropArea = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlowProvider>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        setNodes={setNodes}
        setEdges={setEdges}
        onSelectNode={() => {}}
      />
    </ReactFlowProvider>
  );
};
export default DragAndDropArea;
