import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { FramesProvider } from "./FramesContext";
import { ReactFlowProvider } from "@xyflow/react";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <VideoMetricsProvider>
      <VideoReloadProvider>
        <WebSocketProvider>
          <FramesProvider>{children}</FramesProvider>
        </WebSocketProvider>
      </VideoReloadProvider>
    </VideoMetricsProvider>
  </ReactFlowProvider>
);

export default AppProviders;
