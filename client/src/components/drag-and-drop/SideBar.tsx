import SidebarItem from '@/components/drag-and-drop/SideBarItem';

export default function Sidebar() {
  return (
    <div className="flex-1 border border-gray-900 rounded-md overflow-hidden bg-white h-full">
      <div className="bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300">
        Modules
      </div>
      <div className="p-3 overflow-y-auto h-full">
        <div className="flex flex-wrap gap-2">
          <SidebarItem label="Source" type="input" />
          <SidebarItem label="Denoise" type="process" />
          <SidebarItem label="Encode" type="process" />
          <SidebarItem label="Decode" type="process" />
          <SidebarItem label="UpSample" type="process" />
          <SidebarItem label="DownSample" type="process" />
          <SidebarItem label="Result" type="output" />
        </div>
      </div>
    </div>
  );
}