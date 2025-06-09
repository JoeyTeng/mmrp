import FlowCanvas from '@/components/drag-and-drop/FlowCanvas';
import { ReactFlowProvider } from '@xyflow/react';
import ParameterConfiguration from '@/components/drag-and-drop/ParameterConfiguration';
import SideBar from '@/components/drag-and-drop/SideBar'

const DragAndDropArea = () => {
  return (
    <div className="flex h-[50vh] w-screen overflow-hidden">
      {/* Sidebar */}
      <div className="flex-1 border-gray-300">
        <SideBar />
      </div>

      {/* Flow Canvas */}
      <div className="flex-[2.5] min-w-0">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>

      {/* Parameter Configuration */}
      <div className="flex-1">
        <ParameterConfiguration />
      </div>
    </div>
  );
};

export default DragAndDropArea;