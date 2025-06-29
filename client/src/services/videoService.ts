import { apiClient } from "@/services/apiClient";
import { RefObject } from "react";

export const loadVideo = async (
  videoName: string,
  ref: RefObject<HTMLVideoElement | null>,
) => {
  try {
    const response = await apiClient.get(
      `/video/${encodeURIComponent(videoName)}`,
      {
        responseType: "blob",
        timeout: 30000,
      },
    );
    const url = URL.createObjectURL(response.data);
    if (ref.current) {
      ref.current.src = url;
    }
    return url;
  } catch (e) {
    console.error(`Error loading video ${videoName}`);
    throw e;
  }
};
