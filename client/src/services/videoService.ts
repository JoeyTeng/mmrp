import { apiClient } from "@/services/apiClient";
import { RefObject } from "react";

export const loadVideo = async (
  videoName: string,
  output: boolean,
  ref: RefObject<HTMLVideoElement | null>,
) => {
  try {
    const response = await apiClient.post(
      "/video/",
      {
        video_name: videoName,
        output: output,
      },
      {
        responseType: "blob",
      },
    );

    const url = URL.createObjectURL(response.data);
    if (ref.current) {
      ref.current.src = url;
    }
    return url;
  } catch (e) {
    console.error(`Error loading video ${videoName}`, e);
    throw e;
  }
};
