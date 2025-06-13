'use client'
import { Handle, Node, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { ParamValueType } from '@/components/modules/modulesRegistry';
import { Trash } from 'lucide-react';

export type NodeData = { 
  label: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
};

type CustomNode = Node<NodeData>

export default function FlowNode({
  id,
  type,
  data: { label, params },
  selected
}: NodeProps<CustomNode>) {

  const { deleteElements } = useReactFlow();

  const MAX_VISIBLE = 4; //default no of params visible in node

  return (
    <div className={`w-40 bg-white rounded-lg overflow-hidden text-sm ${
    selected
      ? 'border-2 border-black-100'
      : 'border border-gray-300'
  }`}>
      <div className='px-3 py-1 font-semibold text-gray-800 flex justify-between align-center'>
            {label}
            <Trash size={14}  onClick={(e) => {
              e.stopPropagation();           //prevent the container’s onClick
              deleteElements({ nodes: [{ id }] });
            }}/>
      </div>
      <div className='border-t border-gray-300' />
      <div className='px-3 py-1 space-y-1'>
        {/* by default show the first 4 params */}
        {Object.entries(params).slice(0, MAX_VISIBLE).map(([key, value]) => (
          <div key={key} className='flex justify-between'>
            <span className='font-medium text-gray-500'>{key}</span>
            <span className='text-gray-600 max-w-[55%] truncate break-words'>{String(value)}</span>
          </div>
        ))}
        {Object.entries.length > MAX_VISIBLE && (
          <div className='text-center text-gray-300'>…</div>
        )}
      </div>
      {type !== 'inputNode'
        ? <Handle type='target' position={Position.Left} />
        : null}

      {type !== 'outputNode'
        ? <Handle type='source' position={Position.Right} />
        : null}
    </div>
  )
}