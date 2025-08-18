import type { PipelineRequest, PipelineResponse } from "@/types/pipeline";
import { apiClient } from "./apiClient";

export async function processPipeline(
  pipeline: PipelineRequest,
): Promise<PipelineResponse> {
  const response = await apiClient.post<PipelineResponse>(
    "/pipeline/",
    pipeline,
  );
  return response.data;
}
