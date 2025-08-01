"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";

import { NodeData, NodeType } from "../drag-and-drop/types";
import ParameterConfigurationDrawer from "@/components/drag-and-drop/parameter-configuration/ParameterConfigurationDrawer";
import { useState } from "react";
import { VideoType } from "../comparison-view/types";

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
            colorSpace: "BT.709 Full",
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
        input_colorspace: "RGB",
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
            colorSpace: "BT.709 Full",
          },
        },
      ],
      outputFormats: [
        {
          id: "output-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "BT.709 Full",
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
        video_player: "right",
      },
      inputFormats: [
        {
          id: "input-0",
          formats: {
            pixelFormat: "bgr24",
            colorSpace: "BT.709 Full",
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

interface Props {
  videoType: VideoType;
}

export default function DragAndDropArea({ videoType }: Props) {
  const [editingNode, setEditingNode] = useState<Node<
    NodeData,
    NodeType
  > | null>(null);

  return (
    <ReactFlowProvider>
      <FlowCanvas
        defaultNodes={initialNodes}
        defaultEdges={initialEdges}
        editingNode={editingNode}
        onEditNode={setEditingNode}
        videoType={videoType}
      />
      {editingNode && (
        <ParameterConfigurationDrawer
          editingNode={editingNode}
          clearEditingNode={() => setEditingNode(null)}
        />
      )}
    </ReactFlowProvider>
  );
}
