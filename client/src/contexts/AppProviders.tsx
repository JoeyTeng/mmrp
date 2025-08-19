import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { FramesProvider } from "./FramesContext";
import { ReactFlowProvider } from "@xyflow/react";
import { ModulesProvider } from "./ModulesContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <VideoMetricsProvider>
      <VideoReloadProvider>
        <WebSocketProvider>
          <FramesProvider>
            <ModulesProvider>{children}</ModulesProvider>
          </FramesProvider>
        </WebSocketProvider>
      </VideoReloadProvider>
    </VideoMetricsProvider>
  </ReactFlowProvider>
);

export default AppProviders;
