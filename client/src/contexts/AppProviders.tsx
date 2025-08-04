import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./videoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { FramesProvider } from "./FramesContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <VideoMetricsProvider>
    <VideoReloadProvider>
      <FramesProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </FramesProvider>
    </VideoReloadProvider>
  </VideoMetricsProvider>
);

export default AppProviders;
