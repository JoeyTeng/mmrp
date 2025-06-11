'use client';

import FlowCanvas from '@/components/drag-and-drop/FlowCanvas';
import {
  ReactFlowProvider,
  type Node,
  type Edge,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import ParameterConfiguration from '@/components/drag-and-drop/ParameterConfiguration';
import SideBar from '@/components/drag-and-drop/SideBar';
import { moduleRegistry } from '../modules/modulesRegistry';
import { useCallback, useState } from 'react';

type ParamsValue = string | number | string[];

type NodeData = {
  label: string;
  params: Record<string, ParamsValue>;
};

const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 50, y: 100 },
    data: { label: 'Source', params: { ...moduleRegistry.Source.params } },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '2',
    position: { x: 220, y: 100 },
    data: {
      label: 'DownSample',
      params: { ...moduleRegistry.DownSample.params },
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '3',
    position: { x: 400, y: 100 },
    data: { label: 'Denoise', params: { ...moduleRegistry.Denoise.params } },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: '4',
    type: 'output',
    position: { x: 600, y: 100 },
    data: { label: 'Result', params: { ...moduleRegistry.Result.params } },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
  },
];

const DragAndDropArea = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const updateParam = useCallback(
    (key: string, value: string | number | string[]) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                data: { ...n.data, params: { ...n.data.params, [key]: value } },
              }
            : n
        )
      );
    },
    [selectedId]
  );
  return (
    <div className='flex h-[50vh] w-screen overflow-hidden'>
      {/* Sidebar */}
      <div className='flex-1 border-gray-300'>
        <SideBar />
      </div>

      {/* Flow Canvas */}
      <div className='flex-[2.5] min-w-0'>
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onSelectNode={setSelectedId}
          />
        </ReactFlowProvider>
      </div>

      {/* Parameter Configuration */}
      <div className='flex-1'>
        <ParameterConfiguration
          node={nodes.find((n) => n.id === selectedId)}
          onChange={updateParam}
        />
      </div>
    </div>
  );
};

export default DragAndDropArea;