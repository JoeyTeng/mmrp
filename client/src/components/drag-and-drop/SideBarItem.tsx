'use client';

type SidebarItemProps = {
  label: string;
  type: string;
};

export default function SidebarItem({ label, type }: SidebarItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ type, label });
    event.dataTransfer.setData('application/reactflow', nodeData);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        padding: '8px',
        marginBottom: '4px',
        border: '1px solid #ccc',
        backgroundColor: 'white',
        borderRadius: '4px',
        cursor: 'grab',
      }}
    >
      {label}
    </div>
  );
}
