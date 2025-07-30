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

    const data = response.data;

    const url = URL.createObjectURL(data);
    if (ref.current) {
      ref.current.src = url;
    }

    return { url, size: data.size };
  } catch (e) {
    console.error(`Error loading video ${videoName}`, e);
    throw e;
  }
};
