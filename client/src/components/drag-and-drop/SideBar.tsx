import SidebarItem from '@/components/drag-and-drop/SideBarItem';
import { NodeType } from '@/components/drag-and-drop/FlowCanvas';

export default function Sidebar() {
  return (
    <div className='flex-1 border border-gray-900 rounded-md overflow-hidden bg-white h-full'>
      <div className='bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300'>
        Modules
      </div>
      <div className='p-3 overflow-y-auto h-full'>
        <div className='flex flex-wrap gap-2'>
          <SidebarItem label='Source' type= {NodeType.InputNode} />
          <SidebarItem label='Denoise' type={NodeType.ProcessNode} />
          <SidebarItem label='Encode' type={NodeType.ProcessNode} />
          <SidebarItem label='Decode' type={NodeType.ProcessNode}/>
          <SidebarItem label='UpSample' type={NodeType.ProcessNode}/>
          <SidebarItem label='DownSample' type={NodeType.ProcessNode} />
          <SidebarItem label='Result' type={NodeType.OutputNode} />
        </div>
      </div>
    </div>
  );
}