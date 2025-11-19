// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { VideoMetricsProvider } from "./VideoMetricsContext";
import { VideoReloadProvider } from "./VideoReloadContext";
import { WebSocketProvider } from "./WebSocketContext";
import { ReactFlowProvider } from "@xyflow/react";
import { ModulesProvider } from "./ModulesContext";
import { ExamplePipelinesProvider } from "./ExamplePipelinesContext";

const AppProviders = ({ children }: { children: ReactNode }) => (
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
);

export default AppProviders;
