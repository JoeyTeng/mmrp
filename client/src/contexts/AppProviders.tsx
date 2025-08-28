"use client";
import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { ReactFlowProvider } from "@xyflow/react";
import { ModulesProvider } from "./ModulesContext";
import { ExamplePipelinesProvider } from "./ExamplePipelinesContext";
import { SessionProvider } from "./SessionContext";
import { ToastContainer } from "react-toastify/unstyled";
import "react-toastify/ReactToastify.css";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <>
    <ToastContainer />
    <SessionProvider>
      <ReactFlowProvider>
        <VideoMetricsProvider>
          <VideoReloadProvider>
            <WebSocketProvider>
              <ExamplePipelinesProvider>
                <ModulesProvider>{children}</ModulesProvider>
              </ExamplePipelinesProvider>
            </WebSocketProvider>
          </VideoReloadProvider>
        </VideoMetricsProvider>
      </ReactFlowProvider>
    </SessionProvider>
  </>
);

export default AppProviders;
