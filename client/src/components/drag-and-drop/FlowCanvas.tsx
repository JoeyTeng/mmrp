"use client";

import React, { useCallback, useRef, useState, useMemo } from "react";
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
  OnEdgesChange,
  OnNodesChange,
  Panel,
  useReactFlow,
} from "@xyflow/react";

import type { Node, Edge } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import {
  getInitialNodeParamValue,
  moduleRegistry,
  ParamValueType,
} from "@/components/modules/modulesRegistry";

import FlowNode, { FlowNodeProps } from "@/components/drag-and-drop/FlowNode";
import { NodeData, NodeType } from "./types";
import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import ParameterConfiguration from "@/components/drag-and-drop/ParameterConfiguration";
import { Box, Button } from "@mui/material";
import { sendPipelineToBackend } from "@/services/pipelineService";
import ContextMenu from "./ContextMenu";
import { NODE_CONTEXT_MENU, NodeAction } from "./NodeContextMenu";
import { CANVAS_CONTEXT_MENU, CanvasContextAction } from "./CanvasContextMenu";

type FlowCanvasProps = {
  nodes: Node<NodeData, NodeType>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<NodeData, NodeType>>;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData, NodeType>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onSelectNode: (id: string | null) => void;
};

interface ContextMenuState {
  position: {
    x: number;
    y: number;
  };
  target: "canvas" | "node";
  nodeId?: string;
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onSelectNode,
}: FlowCanvasProps) {
  const FlowNodeWithMenu = (props: FlowNodeProps) => (
    <FlowNode {...props} onOpenMenu={handleNodeOpenMenu} />
  );

  const nodeTypes = {
    [NodeType.InputNode]: FlowNodeWithMenu,
    [NodeType.ProcessNode]: FlowNodeWithMenu,
    [NodeType.OutputNode]: FlowNodeWithMenu,
  };

  const paneRef = useRef<HTMLDivElement>(null);

  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [tempNode, setTempNode] = useState<Node<NodeData, NodeType> | null>(
    null,
  );

  const [contextMenuState, setContextMenuState] =
    useState<ContextMenuState | null>(null);

  const openContextMenu = useCallback((state: ContextMenuState) => {
    setContextMenuState(state);
    setContextMenuOpen(true);
  }, []);

  const closeContextMenu = () => setContextMenuOpen(false);

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    openContextMenu({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      target: "node",
      nodeId: node.id,
    });
  };

  const handleNodeOpenMenu = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const coordinates = event.currentTarget.getBoundingClientRect();
    openContextMenu({
      position: {
        x: coordinates.left,
        y: coordinates.bottom + 6,
      },
      target: "node",
      nodeId: nodeId,
    });
  };

  const onPaneContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    openContextMenu({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      target: "canvas",
    });
  };

  const nodeActionHandlers = useMemo<Record<NodeAction, () => void>>(
    () => ({
      expand: () => console.log("expand clicked"),
      duplicate: () => console.log("duplicate clicked"),
      rename: () => console.log("rename clicked"),
      color: () => console.log("colour clicked"),
      configure: () => console.log("configure clicked"),
      export: () => console.log("export clicked"),
      delete: () => console.log("delete clicked"),
    }),
    [],
  );

  const canvasActionHandlers = useMemo<Record<CanvasContextAction, () => void>>(
    () => ({
      clear: () => console.log("clear canvas"),
      export: () => console.log("export all nodes"),
      run: () => console.log("run pipeline"),
      add_node: () => console.log("add node"),
    }),
    [],
  );

  const handleContextMenuAction = useCallback(
    (id: NodeAction | CanvasContextAction) => {
      if (!contextMenuState) return;
      if (contextMenuState.target === "node")
        nodeActionHandlers[id as NodeAction]?.();
      else if (contextMenuState.target === "canvas")
        canvasActionHandlers[id as CanvasContextAction]?.();
    },
    [contextMenuState, nodeActionHandlers, canvasActionHandlers],
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

  const onConfirm = async () => {
    const pipeline = dumpPipelineToJson(nodes, edges);
    console.log(JSON.stringify(pipeline, null, 2));
    try {
      const res = await sendPipelineToBackend(pipeline);
      console.log("Executing in order", res);
    } catch (err) {
      console.error("Error sending pipleine to backend", err);
    }
  };

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node<NodeData, NodeType>) => {
      event.preventDefault();
      event.stopPropagation();
      setTempNode({ ...node });
      setAppDrawerOpen(true);
    },
    [],
  );

  const handleParamChange = useCallback(
    (key: string, value: ParamValueType) => {
      setTempNode((prev) =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                params: { ...prev.data.params, [key]: value },
              },
            }
          : null,
      );
    },
    [],
  );

  const handleConfirmParams = useCallback(() => {
    if (!tempNode) return;

    setNodes((nds) => nds.map((n) => (n.id === tempNode.id ? tempNode : n)));
    setAppDrawerOpen(false);
  }, [tempNode, setNodes]);

  const handleCancelParams = useCallback(() => {
    setAppDrawerOpen(false);
    setTempNode(null);
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
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
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
          proOptions={{ hideAttribution: true }}
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
          tempNode
            ? `Edit ${tempNode.data.label} Parameters`
            : "Edit Parameters"
        }
        width={400}
        anchor="right"
      >
        <Box display="flex" flexDirection="column" height="100%">
          <Box flex={1} overflow="auto">
            <ParameterConfiguration
              node={tempNode}
              onParamChange={handleParamChange}
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
              disabled={!tempNode}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </AppDrawer>
      <ContextMenu<NodeAction | CanvasContextAction>
        open={contextMenuOpen}
        position={contextMenuState && contextMenuState.position}
        items={
          contextMenuState?.target === "node"
            ? NODE_CONTEXT_MENU
            : contextMenuState?.target === "canvas"
              ? CANVAS_CONTEXT_MENU
              : NODE_CONTEXT_MENU
        }
        dense
        onAction={handleContextMenuAction}
        onClose={closeContextMenu}
      />
    </Box>
  );
}
