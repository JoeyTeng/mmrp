import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./videoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { ReactFlowProvider } from "@xyflow/react";
import { ModulesProvider } from "./ModulesContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <VideoMetricsProvider>
      <VideoReloadProvider>
        <WebSocketProvider>
          <ModulesProvider>{children}</ModulesProvider>
        </WebSocketProvider>
      </VideoReloadProvider>
    </VideoMetricsProvider>
  </ReactFlowProvider>
);

export default AppProviders;
