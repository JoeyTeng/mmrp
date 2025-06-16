'use client';
import { NodeType } from '@/components/drag-and-drop/FlowNode';

type SidebarItemProps = {
  label: string;
  type: NodeType;
};

export default function SidebarItem({ label, type }: SidebarItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ type, label });
    event.dataTransfer.setData('application/reactflow', nodeData);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className='p-2 mb-1 border border-gray-300 bg-gray-50 rounded cursor-grab'
    >
      {label}
    </div>
  );
}