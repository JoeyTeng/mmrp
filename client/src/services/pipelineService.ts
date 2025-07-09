import type { PipelineRequest } from "@/types/pipeline";
import { apiClient } from "./apiClient";

export async function sendPipelineToBackend(
  pipeline: PipelineRequest,
): Promise<boolean> {
  const response = await apiClient.post<boolean>("/pipeline/", pipeline);
  return response.data;
}
