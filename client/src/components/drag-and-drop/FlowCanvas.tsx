"use client";

import React, { useCallback, useContext, useRef } from "react";
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
  Panel,
  useReactFlow,
  getIncomers,
} from "@xyflow/react";

import type { Node, Edge } from "@xyflow/react";

import FlowNode from "@/components/drag-and-drop/FlowNode";
import { FlowCanvasProps, NodeData, NodeType } from "./types";
import { dumpPipelineToJson } from "@/utils/pipelineSerializer";
import { Box, Button } from "@mui/material";
import { sendPipelineToBackend } from "@/services/pipelineService";
import { ModulesContext } from "@/contexts/ModulesContext";
import { useVideoReload } from "@/contexts/videoReloadContext";
import { checkPipeline, getInitialNodeParamValue, makePorts } from "./util";
import { toast } from "react-toastify/unstyled";

const nodeTypes = {
  [NodeType.InputNode]: FlowNode,
  [NodeType.ProcessNode]: FlowNode,
  [NodeType.OutputNode]: FlowNode,
};

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onEditNode,
}: FlowCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);

  const { triggerReload, setIsProcessing, setError, isProcessing } =
    useVideoReload();
  const { screenToFlowPosition, getNodes, getEdges, deleteElements } =
    useReactFlow();

  const handlePaneClick = useCallback(() => {
    paneRef.current?.focus();
  }, []);

  const handlePaneKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === "Delete" || evt.key === "Backspace") {
        //get current state
        const nodes = getNodes();
        const edges = getEdges();

        const selectedNode = nodes.filter((node) => node.selected);
        const selectedEdge = edges.filter((edge) => edge.selected);

        deleteElements({ nodes: selectedNode, edges: selectedEdge });

        evt.preventDefault();
      }
    },
    [getNodes, getEdges, deleteElements],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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
      const hasOneEdge = (src: Node, tgt: Node): boolean => {
        if (
          getOutgoers(src, nodes, edges).length >= 1 ||
          getIncomers(tgt, nodes, edges).length >= 1
        ) {
          return false;
        }
        return true;
      };
      return !hasCycle(target) && hasOneEdge(source, target);
    },
    [getNodes, getEdges],
  );

  const onConfirm = async () => {
    if (checkPipeline(nodes, edges)) {
      const pipeline = dumpPipelineToJson(nodes, edges);
      console.log(JSON.stringify(pipeline, null, 2));
      try {
        toast.success("Pipeline valid, starting processing");
        setIsProcessing(true);
        const res = await sendPipelineToBackend(pipeline);
        console.log("Pipeline processed successfully: ", res);
        setError(false);
        triggerReload();
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

  if (!modules) return null;

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
              className={
                isProcessing ? "bg-gray-200 text-gray-100" : "bg-primary"
              }
              onClick={onConfirm}
              disabled={isProcessing}
            >
              Confirm
            </Button>
          </Panel>
        </ReactFlow>
      </Box>
    </Box>
  );
}
