"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import {
  ReactFlowProvider,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import ParameterConfiguration from "@/components/drag-and-drop/ParameterConfiguration";
import SideBar from "@/components/drag-and-drop/SideBar";
import {
  ParamValueType,
  moduleRegistry,
  getInitialNodeParamValue,
<<<<<<< pipeline-to-json
} from '@/components/modules/modulesRegistry';
import { useCallback, useState } from 'react';
import { dumpPipelineToJson } from '@/utils/pipelineSerializer';
=======
} from "@/components/modules/modulesRegistry";
import { useCallback, useState } from "react";
import { NodeData, NodeType } from "@/components/drag-and-drop/FlowNode";
>>>>>>> main

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const updateParam = useCallback(
    (key: string, value: ParamValueType) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                data: { ...n.data, params: { ...n.data.params, [key]: value } },
              }
            : n,
        ),
      );
    },
    [selectedId, setNodes],
  );

  const handleConfirm = () => {
    const pipeline = dumpPipelineToJson(nodes, edges);
    console.log(JSON.stringify(pipeline, null, 2));

    //TODO: Send to backend
  };

  return (
    <div className="flex h-[50vh] w-screen overflow-hidden">
      {/* Sidebar */}
      <div className="flex-1 border-gray-300">
        <SideBar />
      </div>

      {/* Flow Canvas */}
      <div className="flex-[2.5] min-w-0">
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onSelectNode={setSelectedId}
            onConfirm={handleConfirm}
          />
        </ReactFlowProvider>
      </div>

      {/* Parameter Configuration */}
      <div className="flex-1">
        <ParameterConfiguration
          node={nodes.find((n) => n.id === selectedId)}
          onChange={updateParam}
        />
      </div>
    </div>
  );
};

export default DragAndDropArea;
