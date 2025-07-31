import { useMemo } from "react";
import { useVideoReload } from "@/contexts/videoReloadContext";
import { toast } from "react-toastify/unstyled";

export function useDownloadUtils() {
  const { getLatestVideoInfo, latestResponse } = useVideoReload();

  const downloadSize = useMemo(() => {
    const leftVideoBytes = latestResponse?.left
      ? getLatestVideoInfo("left").size
      : 0;
    const rightVideoBytes = latestResponse?.right
      ? getLatestVideoInfo("right").size
      : 0;
    const totalBytes = leftVideoBytes + rightVideoBytes;

    if (totalBytes === 0) return "";

    const units = ["bytes", "KB", "MB", "GB"];
    const base = Math.log(totalBytes) / Math.log(1024);
    const unitIndex = Math.floor(base);
    const formattedSize = Math.pow(1024, base - unitIndex).toFixed(1);

    return `${formattedSize} ${units[unitIndex]}`;
  }, [getLatestVideoInfo, latestResponse]);

  function handleDownload() {
    if (!latestResponse?.left && !latestResponse?.right) {
      toast.warn(
        "Please run the pipeline first to download a processed video.",
      );
      return;
    }

    const links: { id: "left" | "right"; filename: string }[] = [];

    if (latestResponse.left) {
      const videoInfo = getLatestVideoInfo("left");
      if (videoInfo.url) {
        links.push({ id: "left", filename: latestResponse.left });
      }
    }

    if (latestResponse.right) {
      const videoInfo = getLatestVideoInfo("right");
      if (videoInfo.url) {
        links.push({ id: "right", filename: latestResponse.right });
      }
    }

    links.forEach(({ id, filename }) => {
      const videoInfo = getLatestVideoInfo(id);
      if (videoInfo.url) {
        const a = document.createElement("a");
        a.href = videoInfo.url;
        a.download = filename;
        a.click();
        toast.success(`Video download started (${downloadSize})`);
        a.remove();
      }
    });
  }

  return { handleDownload, downloadSize };
}
