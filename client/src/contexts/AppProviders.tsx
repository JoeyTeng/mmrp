import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./videoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { SidebarProvider } from "./SideBarContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <VideoMetricsProvider>
      <VideoReloadProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </VideoReloadProvider>
    </VideoMetricsProvider>
  </SidebarProvider>
);

export default AppProviders;
