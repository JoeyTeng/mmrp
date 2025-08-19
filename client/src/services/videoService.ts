import { apiClient } from "@/services/apiClient";
import { RefObject } from "react";
import axios from "axios";

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
    if (axios.isAxiosError(e)) {
      const data = e.response?.data;
      if (data instanceof Blob) {
        const text = await data.text();
        let message = text;
        try {
          const j = JSON.parse(text);
          message = j?.detail ?? text;
        } catch {}
        throw new Error(message);
      }
    }
    throw e;
  }
};
