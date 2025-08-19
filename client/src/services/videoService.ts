import { apiClient } from "@/services/apiClient";
import { VideoInfoRequest } from "@/types/video";
import { useCallback } from "react";

export const useVideoService = () => {
  const loadVideo = useCallback(async ({ name, output }: VideoInfoRequest) => {
    try {
      const response = await apiClient.post(
        "/video/",
        { video_name: name, output },
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      return { name, url, size: response.data.size };
    } catch (e) {
      throw e;
    }
  }, []);

  const uploadVideo = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (e) {
      throw e;
    }
  }, []);

  return { loadVideo, uploadVideo };
};
