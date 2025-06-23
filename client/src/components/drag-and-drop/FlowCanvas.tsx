"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { OnEdgesChange, OnNodesChange, useReactFlow } from "@xyflow/react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
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
  getPortsForNode,
  moduleRegistry,
} from "@/components/modules/modulesRegistry";
import FlowNode, {
  NodeData,
  NodeType,
} from "@/components/drag-and-drop/FlowNode";
import isNodeConnectionValid from "@/components/modules/modulesFormatValidator";
import { toast } from "react-toastify";

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
  onConfirm: () => void;
};

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onSelectNode,
  onConfirm,
}: FlowCanvasProps) {
  const paneRef = useRef<HTMLDivElement>(null);

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

  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const invalidEdges = useRef<Set<string>>(new Set());

  const onConnect = useCallback(
    (connection: Connection) => {
      const nodes = getNodes() as Node<NodeData, NodeType>[];
      const source = nodes.find((node) => node.id === connection.source);
      const target = nodes.find((node) => node.id === connection.target);

      if (!source || !target) return;

      const { isValid, reason } = isNodeConnectionValid(
        source,
        connection.sourceHandle ?? "",
        target,
        connection.targetHandle ?? "",
      );

      const edgeId = `${+new Date()}`;

      if (isValid) {
        invalidEdges.current.delete(edgeId);
        setEdges((eds) => addEdge({ ...connection, id: edgeId }, eds));
      } else {
        if (!invalidEdges.current.has(edgeId)) {
          toast.error(`Error: ${reason}`, {
            position: "top-right",
            autoClose: false, // User must dismiss manually
            closeOnClick: true,
          });
          invalidEdges.current.add(edgeId);
        }
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: edgeId,
              style: { stroke: "red", strokeWidth: 1, strokeDasharray: "4 2" },
            },
            eds,
          ),
        );
      }
    },
    [setEdges],
  );

  useEffect(
    () => {
      setEdges((edges) => {
        const nodes = getNodes() as Node<NodeData, NodeType>[];
        return edges.map((edge) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) {
            return edge;
          }

          const { isValid, reason } = isNodeConnectionValid(
            source,
            edge.sourceHandle ?? "",
            target,
            edge.targetHandle ?? "",
          );

          if (isValid && invalidEdges.current.has(edge.id)) {
            invalidEdges.current.delete(edge.id);
          }

          if (!isValid && !invalidEdges.current.has(edge.id)) {
            toast.error(
              `Existing connection became invalid, Please rectify, ${reason}`,
              {
                position: "top-right",
                autoClose: false,
              },
            );
            invalidEdges.current.add(edge.id);
          }

          return {
            ...edge,
            style: isValid
              ? {}
              : {
                  stroke: "red",
                  strokeWidth: 1,
                  strokeDasharray: "4 2",
                  animated: true,
                },
          };
        });
      });
    },
    /* Re-run only when node output format change (for now): stringify to enforce content comparison and not referential */
    [
      JSON.stringify(
        nodes.map((n) =>
          getPortsForNode(n.data.label, n.data.params).outputPorts.map(
            (p) => p.formats,
          ),
        ),
      ),
      getNodes,
      setEdges,
    ],
  );

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

      const moduleConfig = moduleRegistry[label];
      const defaultParams = moduleConfig
        ? getInitialNodeParamValue(moduleConfig.params)
        : {};

      const newNode = {
        id: `${+new Date()}`,
        type,
        position,
        data: {
          label: `${label}`,
          params: defaultParams,
          inputPorts: moduleConfig?.inputPorts || [],
          outputPorts: moduleConfig?.outputPorts || [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const nodes: Node[] = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id == connection.target);
      if (!target || target.id == connection.source) return false;
      const hasCycle = (node: Node, visited = new Set()) => {
        if (visited.has(node.id)) return false;
        visited.add(node);

        for (const i of getOutgoers(node, nodes, edges)) {
          if (i.id == connection.source || hasCycle(i, visited)) {
            return true;
          }
        }
      };
      return !hasCycle(target);
    },
    [getNodes, getEdges],
  );

  return (
    <div
      className="w-full h-full overflow-hidden bg-gray-100 relative"
      ref={paneRef}
      tabIndex={0} // make this div focusable
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
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        fitView
        className="w-full h-full"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={onConfirm}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-700 transition cursor-pointer"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
