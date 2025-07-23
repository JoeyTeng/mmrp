"use client";

type ModuleItemProps = {
  id: string;
  label: string;
};

export default function ModuleItem({ id, label }: ModuleItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ id, label });
    event.dataTransfer.setData("application/reactflow", nodeData);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-2 mb-1 border border-gray-300 bg-gray-50 rounded cursor-grab"
    >
      {label}
    </div>
  );
}
