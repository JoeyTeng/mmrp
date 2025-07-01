"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import {
  ReactFlowProvider,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import { NodeData, NodeType } from "../drag-and-drop/types";

const initialNodes: Node<NodeData, NodeType>[] = [
  {
    id: "1",
    type: NodeType.InputNode,
    position: { x: 0, y: 100 },
    data: {
      label: "source",
      params: {
        path: "example-video.mp4",
      },
      inputFormats: [],
      outputFormats: [
        {
          id: "output-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "sRGB",
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
      label: "colorspace",
      params: {
        input_colorspace: "YCrCb",
        output_colorspace: "YCrCb",
      },
      inputFormats: [
        {
          id: "input-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "param:input_colorspace",
          },
        },
      ],
      outputFormats: [
        {
          id: "output-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "param:output_colorspace",
          },
        },
      ],
    },
  },
  {
    id: "3",
    type: NodeType.ProcessNode,
    position: { x: 400, y: 100 },
    data: {
      label: "blur",
      params: {
        kernel_size: 5,
        method: "gaussian",
      },
      inputFormats: [
        {
          id: "input-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "sRGB",
          },
        },
        {
          id: "input-1",
          formats: {
            pixelFormat: "rgb24",
            colorSpace: "sRGB",
          },
        },
        {
          id: "input-2",
          formats: {
            pixelFormat: "gray8",
            colorSpace: "sRGB",
          },
        },
      ],
      outputFormats: [
        {
          id: "output-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "sRGB",
          },
        },
        {
          id: "output-1",
          formats: {
            pixelFormat: "rgb24",
            colorSpace: "sRGB",
          },
        },
        {
          id: "output-2",
          formats: {
            pixelFormat: "gray8",
            colorSpace: "sRGB",
          },
        },
      ],
    },
  },
  {
    id: "4",
    type: NodeType.OutputNode,
    position: { x: 600, y: 100 },
    data: {
      label: "result",
      params: {
        path: "example_output.webm",
      },
      inputFormats: [
        {
          id: "input-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "sRGB",
          },
        },
      ],
      outputFormats: [],
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
