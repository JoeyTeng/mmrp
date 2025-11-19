// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import type { PipelineRequest, PipelineResponse } from "@/types/pipeline";
import { apiClient } from "./apiClient";

export async function sendPipelineToBackend(
  pipeline: PipelineRequest,
): Promise<PipelineResponse> {
  const response = await apiClient.post<PipelineResponse>(
    "/pipeline/",
    pipeline,
  );
  return response.data;
}
