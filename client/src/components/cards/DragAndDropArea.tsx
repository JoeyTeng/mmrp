import FlowCanvas from "../drag-and-drop/FlowCanvas";
import { ReactFlowProvider } from '@xyflow/react';
import ParameterConfiguration from "../drag-and-drop/ParameterConfiguration";
import SideBar from "../drag-and-drop/SideBar";


const DragAndDropArea = () => {


  return (
    <div
      style={{
        display: 'flex',        
        height: '50vh', 
        width: '100vw',
        overflow: 'hidden'      
      }}
    >
        <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
        <SideBar />
      </div>
   <div style={{ flex: 2.5, borderRight: '1px solid #ccc', minWidth: 0,  }}>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
      </div>

      {/* Right column: Parameter config */}
      <div style={{flex: 1}}>
       <ParameterConfiguration/>
        
      </div>
    </div>
  );
};

export default DragAndDropArea;
