import { validateConfigFile } from "@/utils/configValidator";
import { apiClient } from "./apiClient";

export async function uploadBinaryToBackend(files: FormData): Promise<boolean> {
  const validJson = await validateConfigFile(files.get("config") as File);
  if (!validJson) {
    throw new Error(
      "The config file does not follow the required structure. (See template)",
    );
  }
  const response = await apiClient.post<boolean>("/module/upload", files, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
