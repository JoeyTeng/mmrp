"use client";

import React, { useCallback, useContext, useRef, useMemo } from "react";

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
} from "@xyflow/react";

import type { Node, Edge } from "@xyflow/react";

import FlowNode, { FlowNodeProps } from "@/components/drag-and-drop/FlowNode";
import { FlowCanvasProps, NodeData, NodeType } from "./types";
import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { Box, Button } from "@mui/material";
import { sendPipelineToBackend } from "@/services/pipelineService";
import DeleteIcon from "@mui/icons-material/Delete";
import { ModulesContext } from "@/contexts/ModulesContext";
import { checkPipeline, getInitialNodeParamValue, makePorts } from "./util";
import NodeContextMenu, {
  NodeContextMenuHandle,
} from "./context-menu/NodeContextMenu";
import CanvasContextMenu, {
  CanvasContextMenuHandle,
} from "./context-menu/CanvasContextMenu";
import { useVideoReload } from "@/contexts/videoReloadContext";
import { toast } from "react-toastify/unstyled";

export default function FlowCanvas({
  defaultNodes,
  defaultEdges,
  editingNode,
  onEditNode,
}: FlowCanvasProps) {
  const nodeContextMenuRef = useRef<NodeContextMenuHandle>(null);
  const canvasContextMenuRef = useRef<CanvasContextMenuHandle>(null);

  const { triggerReload, setIsProcessing, setError, isProcessing } =
    useVideoReload();
  const { screenToFlowPosition, getNodes, getEdges, setNodes, setEdges } =
    useReactFlow();
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
  const unselectNodesandEdges = useCallback(() => {
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
      selectNode(nodeId);

      nodeContextMenuRef.current?.open({
        position: {
          x: coordinates.left,
          y: coordinates.bottom + 6,
        },
        nodeId: nodeId,
      });
    },
    [selectNode],
  );

  const FlowNodeWithMenu = useCallback(
    (props: FlowNodeProps) => (
      <FlowNode {...props} onOpenMenu={handleNodeOpenMenu} />
    ),
    [handleNodeOpenMenu],
  );

  const nodeTypes = useMemo(
    () => ({
      [NodeType.InputNode]: FlowNodeWithMenu,
      [NodeType.ProcessNode]: FlowNodeWithMenu,
      [NodeType.OutputNode]: FlowNodeWithMenu,
    }),
    [FlowNodeWithMenu],
  );

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
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
    unselectNodesandEdges();
    canvasContextMenuRef.current?.open({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const modules = useContext(ModulesContext);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      const { type: typeValueStr, label } = JSON.parse(nodeData);
      const type = typeValueStr as NodeType;
      const moduleDef = modules.find((m) => m.name === label)!;
      if (!moduleDef) {
        console.error("Modules not yet loaded or cannot find module name");
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultParams = getInitialNodeParamValue(moduleDef.parameters);
      const inputPorts = makePorts(moduleDef.inputFormats, "input");
      const outputPorts = makePorts(moduleDef.outputFormats, "output");

      const newNode: Node<NodeData, NodeType> = {
        id: `${+new Date()}`,
        type,
        position,
        data: {
          label: `${label}`,
          params: defaultParams,
          inputFormats: inputPorts,
          outputFormats: outputPorts,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes, modules],
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
    const nodes: Node<NodeData, NodeType>[] = getNodes() as Node<
      NodeData,
      NodeType
    >[];
    const edges: Edge[] = getEdges();
    if (checkPipeline(nodes, edges)) {
      const pipeline = dumpPipelineToJson(nodes, edges);
      console.debug(JSON.stringify(pipeline, null, 2));
      try {
        toast.success("Pipeline valid, starting processing");
        setIsProcessing(true);
        const res = await sendPipelineToBackend(pipeline);
        setError(false);
        triggerReload(res);
      } catch (err) {
        console.error("Error sending pipeline to backend", err);
        setError(true);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node<NodeData, NodeType>) => {
      event.preventDefault();
      event.stopPropagation();
      onEditNode(node);
    },
    [onEditNode],
  );

  const closeContextMenus = () => {
    nodeContextMenuRef.current?.close();
    canvasContextMenuRef.current?.close();
  };

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
                isProcessing ? "bg-gray-200 text-gray-100" : "bg-primary"
              }
              onClick={onRun}
              disabled={isProcessing}
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
