import {
  SaveOutlined,
  CloudUploadOutlined,
  FileDownloadOutlined,
  AppsOutlined,
} from "@mui/icons-material";
import Modules from "../drag-and-drop/Modules";
import { SidebarItem } from "./types";
import { useVideoReload } from "@/contexts/videoReloadContext";
import { toast } from "react-toastify/unstyled";

export const useLeftSidebarItems = (): SidebarItem[] => {
  const { getLatestVideoUrl, latestResponse, isProcessing } = useVideoReload();

  const handleDownload = () => {
    if (!latestResponse?.left && !latestResponse?.right) {
      toast.warn(
        "Please run the pipeline first to download a processed video.",
      );
      return;
    }

    const links: { id: "left" | "right"; filename: string }[] = [];

    if (latestResponse.left) {
      const url = getLatestVideoUrl("left");
      if (url) links.push({ id: "left", filename: latestResponse.left });
    }

    if (latestResponse.right) {
      const url = getLatestVideoUrl("right");
      if (url) links.push({ id: "right", filename: latestResponse.right });
    }

    links.forEach(({ id, filename }) => {
      const url = getLatestVideoUrl(id);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        a.remove();
      }
    });
  };

  return [
    {
      id: "save",
      title: "Save",
      icon: <SaveOutlined />,
      action: () => console.log("Save clicked"),
    },
    {
      id: "download",
      title: "Download",
      icon: <FileDownloadOutlined />,
      disabled: isProcessing || !!!latestResponse,
      action: handleDownload,
    },
    {
      id: "upload",
      title: "Upload",
      icon: <CloudUploadOutlined />,
      action: () => console.log("Upload clicked"),
    },
    {
      id: "modules",
      title: "Modules",
      icon: <AppsOutlined />,
      panelContent: <Modules />,
      showArrow: true,
      showAfterDivider: true,
    },
  ];
};
