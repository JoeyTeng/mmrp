"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  OnEdgesChange,
  OnNodesChange,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
  IsValidConnection,
  BackgroundVariant,
  Position,
  MarkerType,
  getOutgoers,
  type Node,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import {
  getInitialNodeParamValue,
  moduleRegistry,
  ParamValueType,
} from "@/components/modules/modulesRegistry";

import FlowNode from "@/components/drag-and-drop/FlowNode";
import { NodeData, NodeType } from "./types";
import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import ParameterConfiguration from "@/components/drag-and-drop/ParameterConfiguration";
import { Box, Button } from "@mui/material";

const nodeTypes = {
  [NodeType.InputNode]: FlowNode,
  [NodeType.ProcessNode]: FlowNode,
  [NodeType.OutputNode]: FlowNode,
};

type FlowCanvasProps = {
  nodes: Node<NodeData, NodeType>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<NodeData, NodeType>>;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData, NodeType>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onSelectNode: (id: string | null) => void;
};

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onSelectNode,
}: FlowCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node<
    NodeData,
    NodeType
  > | null>(null);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [tempParams, setTempParams] = useState<Record<string, ParamValueType>>(
    {},
  );

  const handlePaneClick = () => {
    paneRef.current?.focus();
  };

  const handlePaneKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === "Delete" || evt.key === "Backspace") {
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !e.selected));
        evt.preventDefault();
      }
    },
    [setNodes, setEdges],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      const { type: typeValueStr, label } = JSON.parse(nodeData);
      const type = typeValueStr as NodeType;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const moduleParams = moduleRegistry[label];
      const defaultParams = moduleParams
        ? getInitialNodeParamValue(moduleParams.params)
        : {};

      const newNode = {
        id: `${+new Date()}`,
        type,
        position,
        data: { label: `${label}`, params: defaultParams },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const isValidConnection: IsValidConnection<Edge> = useCallback(
    (connection: Connection | Edge) => {
      const conn = connection as Connection;
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id == connection.target);
      if (!target || target.id == connection.source) return false;
      const hasCycle = (node: Node, visited = new Set<string>()) => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);
        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === conn.source || hasCycle(outgoer, visited))
            return true;
        }
        return false;
      };
      return !hasCycle(target);
    },
    [getNodes, getEdges],
  );

  const onConfirm = () => {
    const pipeline = dumpPipelineToJson(nodes, edges);
    console.log(JSON.stringify(pipeline, null, 2));

    //TODO: Send to backend
  };

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node<NodeData, NodeType>) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedNode(node);
      setTempParams({ ...node.data.params });
      setAppDrawerOpen(true);
    },
    [],
  );

  const handleParamChange = useCallback(
    (params: Record<string, ParamValueType>) => {
      setTempParams(params);
    },
    [],
  );

  const handleConfirmParams = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              params: tempParams,
            },
          };
        }
        return node;
      }),
    );
    setAppDrawerOpen(false);
  }, [selectedNode, setNodes, tempParams]);

  const handleCancelParams = useCallback(() => {
    setAppDrawerOpen(false);
    setSelectedNode(null);
  }, []);

  return (
    <Box className="w-full h-full relative bg-white rounded-lg border border-gray-300">
      <Box
        className="w-full h-full"
        ref={paneRef}
        tabIndex={0}
        onClick={handlePaneClick}
        onKeyDown={handlePaneKeyDown}
      >
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          isValidConnection={isValidConnection}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionChange={({ nodes: selected }) =>
            onSelectNode(selected.length ? selected[0].id : null)
          }
          onNodeDoubleClick={onNodeDoubleClickHandler}
          fitViewOptions={{
            padding: 1,
          }}
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
          }}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="bottom-right">
            <Button
              variant="contained"
              className="bg-primary"
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </Panel>
        </ReactFlow>
      </Box>
      <AppDrawer
        open={appDrawerOpen}
        onClose={handleCancelParams}
        title={
          selectedNode
            ? `Edit ${selectedNode.data.label} Parameters`
            : "Edit Parameters"
        }
        width={400}
        anchor="right"
      >
        <Box display="flex" flexDirection="column" height="100%">
          <Box flex={1} overflow="auto">
            <ParameterConfiguration
              node={selectedNode}
              onChange={handleParamChange}
            />
          </Box>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button variant="outlined" onClick={handleCancelParams}>
              Cancel
            </Button>
            <Button
              className="bg-primary"
              variant="contained"
              onClick={handleConfirmParams}
              disabled={!selectedNode}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </AppDrawer>
    </Box>
  );
}
