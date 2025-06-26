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
      inputPorts: [], // No input ports for a source node
      outputPorts: [
        {
          id: "output-0",
          label: "Video Output",
          formats: {
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
    },
  },
  {
    id: "2",
    type: NodeType.ProcessNode,
    position: { x: 220, y: 100 },
    data: {
      label: "DownSample",
      params: getInitialNodeParamValue(moduleRegistry.DownSample.params),
      inputPorts: [
        {
          id: "input-0",
          label: "Video Input",
          formats: {
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
      outputPorts: [
        {
          id: "output-0",
          label: "Downsampled Video Output",
          formats: {
            resolution: { width: 960, height: 540 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
    },
  },
  {
    id: "3",
    type: NodeType.ProcessNode,
    position: { x: 420, y: 100 },
    data: {
      label: "Denoise",
      params: getInitialNodeParamValue(moduleRegistry.Denoise.params),
      inputPorts: [
        {
          id: "input-0", // Hardcoded port ID
          label: "Video Input",
          formats: {
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
      outputPorts: [
        {
          id: "output-0", // Hardcoded port ID
          label: "Denoised Video Output",
          formats: {
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
    },
  },
  {
    id: "4",
    type: NodeType.OutputNode,
    position: { x: 620, y: 100 },
    data: {
      label: "Result",
      params: getInitialNodeParamValue(moduleRegistry.Result.params),
      inputPorts: [
        {
          id: "input-0",
          label: "Final Video Input",
          formats: {
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            pixelFormat: "YUV420",
            colorSpace: "BT.709",
          },
        },
      ],
      outputPorts: [],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    sourceHandle: "output-0",
    target: "2",
    targetHandle: "input-0",
  },
  {
    id: "e2-3",
    source: "2",
    sourceHandle: "output-0",
    target: "3",
    targetHandle: "input-0",
  },
  {
    id: "e3-4",
    source: "3",
    sourceHandle: "output-0",
    target: "4",
    targetHandle: "input-0",
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
