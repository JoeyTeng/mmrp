"use client";

import React, { useCallback, useRef, useMemo } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  Connection,
  IsValidConnection,
  BackgroundVariant,
  Position,
  MarkerType,
  getOutgoers,
  Panel,
  useReactFlow,
  ControlButton,
  getIncomers,
  SelectionMode,
} from "@xyflow/react";

import type { Node, Edge } from "@xyflow/react";

import FlowNode, { FlowNodeProps } from "@/components/drag-and-drop/FlowNode";
import { FlowCanvasProps } from "./types";
import { ModuleData, ModuleType } from "@/types/module";
import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { Box, Button } from "@mui/material";
import { sendPipelineToBackend } from "@/services/pipelineService";
import DeleteIcon from "@mui/icons-material/Delete";
import { useModulesContext } from "@/contexts/ModulesContext";
import { checkPipeline } from "./util";
import NodeContextMenu, {
  NodeContextMenuHandle,
} from "./context-menu/NodeContextMenu";
import CanvasContextMenu, {
  CanvasContextMenuHandle,
} from "./context-menu/CanvasContextMenu";
import { useVideoReload } from "@/contexts/VideoReloadContext";
import { toast } from "react-toastify/unstyled";
import { VideoType } from "../comparison-view/types";
import { useFrames } from "@/contexts/FramesContext";

export default function FlowCanvas({
  defaultNodes,
  defaultEdges,
  editingNode,
  onEditNode,
}: FlowCanvasProps) {
  const nodeContextMenuRef = useRef<NodeContextMenuHandle>(null);
  const canvasContextMenuRef = useRef<CanvasContextMenuHandle>(null);

  const {
    triggerReload,
    triggerWebSocketConnection,
    setIsProcessing,
    setError,
    isProcessing,
    selectedVideoType,
    handlePipelineRun,
  } = useVideoReload();
  const { screenToFlowPosition, getNodes, getEdges, setNodes, setEdges } =
    useReactFlow();
  const { resetFrames, isStreamActive } = useFrames();
  const selectNode = useCallback(
    (nodeId: string) => {
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          selected: node.id === nodeId,
        })),
      );
    },
    [setNodes],
  );
  const unselectNodesAndEdges = useCallback(() => {
    setNodes((nodes: Node[]) =>
      nodes.map((node) => ({
        ...node,
        selected: false,
      })),
    );

    setEdges((edges: Edge[]) =>
      edges.map((edge) => ({
        ...edge,
        selected: false,
      })),
    );
  }, [setNodes, setEdges]);

  const handleNodeOpenMenu = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault();
      event.stopPropagation();

      const coordinates = event.currentTarget.getBoundingClientRect();
      unselectNodesAndEdges();
      selectNode(nodeId);

      nodeContextMenuRef.current?.open({
        position: {
          x: coordinates.left,
          y: coordinates.bottom + 6,
        },
        nodeId: nodeId,
      });
    },
    [selectNode, unselectNodesAndEdges],
  );

  const FlowNodeWithMenu = useCallback(
    (props: FlowNodeProps) => (
      <FlowNode {...props} onOpenMenu={handleNodeOpenMenu} />
    ),
    [handleNodeOpenMenu],
  );

  const nodeTypes = useMemo(
    () => ({
      [ModuleType.InputNode]: FlowNodeWithMenu,
      [ModuleType.ProcessNode]: FlowNodeWithMenu,
      [ModuleType.OutputNode]: FlowNodeWithMenu,
    }),
    [FlowNodeWithMenu],
  );

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    unselectNodesAndEdges();
    selectNode(node.id);
    nodeContextMenuRef.current?.open({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      nodeId: node.id,
    });
  };

  const onPaneContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    unselectNodesAndEdges();
    canvasContextMenuRef.current?.open({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const { modules } = useModulesContext();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData("application/reactflow");

      if (!nodeData) return;

      const { type, data: moduleData } = JSON.parse(nodeData);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create Node for the Canvas
      const newNode: Node<ModuleData, ModuleType> = {
        id: crypto.randomUUID(),
        type,
        position,
        data: {
          ...moduleData,
        },
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
      const source = nodes.find((node) => node.id == conn.source);
      const target = nodes.find((node) => node.id == conn.target);
      if (!source || !target || source.id == target.id) return false;
      const hasCycle = (node: Node, visited = new Set<string>()) => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);
        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === conn.source || hasCycle(outgoer, visited))
            return true;
        }
        return false;
      };
      const hasOneIncomingConnection = (src: Node, tgt: Node): boolean => {
        if (getIncomers(tgt, nodes, edges).length >= 1) {
          return false;
        }
        return true;
      };
      return !hasCycle(target) && hasOneIncomingConnection(source, target);
    },
    [getNodes, getEdges],
  );

  const onRun = async () => {
    const nodes: Node<ModuleData, ModuleType>[] = getNodes() as Node<
      ModuleData,
      ModuleType
    >[];
    const edges: Edge[] = getEdges();
    if (checkPipeline(nodes, edges)) {
      const pipeline = dumpPipelineToJson(nodes, edges);

      try {
        toast.success("Pipeline valid, starting processing");
        setIsProcessing(true);
        handlePipelineRun();
        if (selectedVideoType == VideoType.Video) {
          resetFrames();
          // Classic backend pipeline processing
          const res = await sendPipelineToBackend(pipeline);
          setError(false);
          triggerReload(res); // Use response to load video
        } else if (selectedVideoType == VideoType.Stream) {
          // Stream mode - trigger WS connection using pipeline
          setError(false);
          triggerWebSocketConnection(pipeline); // Send pipeline to context for FrameStreamPlayer
        }
      } catch (err) {
        console.error("Error sending pipeline to backend", err);
        setError(true);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node<ModuleData, ModuleType>) => {
      event.preventDefault();
      event.stopPropagation();
      onEditNode(node);
    },
    [onEditNode],
  );

  const closeContextMenus = useCallback(() => {
    nodeContextMenuRef.current?.close();
    canvasContextMenuRef.current?.close();
  }, []);

  if (!modules) return null;

  return (
    <Box
      className="w-full h-full relative bg-white rounded-lg border border-gray-300"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Box className="w-full h-full">
        <ReactFlow
          nodeTypes={nodeTypes}
          deleteKeyCode={editingNode != null ? [] : ["Delete", "Backspace"]}
          defaultNodes={defaultNodes}
          defaultEdges={defaultEdges}
          isValidConnection={isValidConnection}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDoubleClick={onNodeDoubleClickHandler}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodesDelete={closeContextMenus}
          onEdgesDelete={closeContextMenus}
          fitViewOptions={{
            padding: 1,
          }}
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            interactionWidth: 20,
          }}
          fitView
          proOptions={{ hideAttribution: true }}
          reconnectRadius={50}
          panOnScroll
          panOnScrollSpeed={1}
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
        >
          <Controls>
            <ControlButton
              onClick={() => canvasContextMenuRef.current?.clearAll()}
            >
              <DeleteIcon className="fill-red-700" sx={{ scale: 1.2 }} />
            </ControlButton>
          </Controls>
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="bottom-right">
            <Button
              variant="contained"
              className={
                isProcessing || isStreamActive
                  ? "bg-gray-200 text-gray-100"
                  : "bg-primary"
              }
              onClick={onRun}
              loading={isProcessing || isStreamActive}
            >
              Run
            </Button>
          </Panel>
        </ReactFlow>
      </Box>
      <NodeContextMenu ref={nodeContextMenuRef} onEditNode={onEditNode} />
      <CanvasContextMenu ref={canvasContextMenuRef} onRun={onRun} />
    </Box>
  );
}
