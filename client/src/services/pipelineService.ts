import type { PipelineRequest } from "@/types/pipeline";
import { RequestHandler } from "./requestHandler";

export async function sendPipelineToBackend(
  pipeline: PipelineRequest,
): Promise<string[]> {
  const response = await RequestHandler.post<string[]>("/pipeline", pipeline);
  return response;
}
