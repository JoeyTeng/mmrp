import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { ReactFlowProvider } from "@xyflow/react";
import { VideoProvider } from "./VideoContext";
import { ModulesProvider } from "./ModulesContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ReactFlowProvider>
    <VideoMetricsProvider>
      <VideoProvider>
        <ModulesProvider>
          <VideoReloadProvider>
            <WebSocketProvider>{children}</WebSocketProvider>
          </VideoReloadProvider>
        </ModulesProvider>
      </VideoProvider>
    </VideoMetricsProvider>
  </ReactFlowProvider>
);

export default AppProviders;
