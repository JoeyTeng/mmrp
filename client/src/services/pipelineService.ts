import type { PipelineRequest } from "@/types/pipeline";
import axios from "axios";

export async function sendPipelineToBackend(
  pipeline: PipelineRequest,
): Promise<string[]> {
  const response = await axios.post<string[]>("/pipeline", pipeline);
  return response.data;
}
