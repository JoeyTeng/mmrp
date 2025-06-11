'use client';

import React, { useCallback, useRef } from 'react';
import { OnEdgesChange, OnNodesChange, useReactFlow } from '@xyflow/react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
  BackgroundVariant,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { moduleRegistry } from '../modules/modulesRegistry';

type ParamsValue = string | number | string[];

type NodeData = {
  label: string;
  params: Record<string, ParamsValue>;
};

type FlowCanvasProps = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<NodeData>>;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<any>[]>>;
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

  const handlePaneClick = () => {
    paneRef.current?.focus();
  };

  const handlePaneKeyDown = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !e.selected));
        evt.preventDefault();
      }
    },
    [setNodes, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData('application/reactflow');
      if (!nodeData) return;

      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      const { type, label } = JSON.parse(nodeData);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const moduleParams = moduleRegistry[label];
      const defaultParams = moduleParams?.params ?? {};

      const newNode = {
        id: `${+new Date()}`,
        type,
        position,
        data: { label: `${label}`, params: { ...defaultParams } },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div
      className='w-full h-full overflow-hidden bg-gray-100'
      ref={paneRef}
      tabIndex={0} // make this div focusable
      onClick={handlePaneClick}
      onKeyDown={handlePaneKeyDown}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={({ nodes: selected }) =>
          onSelectNode(selected.length ? selected[0].id : null)
        }
        fitView
        className='w-full h-full'
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}