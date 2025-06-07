import SidebarItem from '../drag-and-drop/SideBarItem'

export default function Sidebar() {
  return (
   
    <div style ={{height: '100%', overflowY: 'auto',border:'1px solid #444'}}>
       <div className='header'>
        Modules
      </div>
      <div style={{display: 'flex', flex: 1, flexWrap: 'wrap', gap: '10px', padding: '10px'}}>
      <SidebarItem label="Source" type="input" />
      <SidebarItem label="Denoise" type="process" />
      <SidebarItem label="Encode" type="process" />
      <SidebarItem label="Decode" type="process" />
      <SidebarItem label="UpSample" type="process" />
      <SidebarItem label="DownSample" type="process" />
      <SidebarItem label="Result" type="output" />
      </div>
    </div>
  );
}
