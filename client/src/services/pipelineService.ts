import type { PipelineRequest } from "@/types/pipeline";
import { apiClient } from "./apiClient";

export async function sendPipelineToBackend(
  pipeline: PipelineRequest,
): Promise<string[]> {
  const response = await apiClient.post<string[]>("/pipeline", pipeline);
  return response.data;
}
