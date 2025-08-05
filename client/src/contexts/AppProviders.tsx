import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <VideoMetricsProvider>
    <VideoReloadProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </VideoReloadProvider>
  </VideoMetricsProvider>
);

export default AppProviders;
