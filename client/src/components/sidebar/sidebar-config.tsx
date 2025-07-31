import {
  QueryStatsOutlined,
  FilterAltOutlined,
  UploadFileOutlined,
  AppsOutlined,
  SaveOutlined,
  DownloadOutlined,
} from "@mui/icons-material";
import { SidebarItem } from "./types";
import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";
import Modules from "../drag-and-drop/Modules";
import { PipelineResponse } from "@/types/pipeline";

export const getLeftSidebarItems = (
  setUploadOpen: (open: boolean) => void,
  handleDownload: () => void,
  downloadSize: string,
  isProcessing: boolean,
  latestResponse: PipelineResponse | null,
): SidebarItem[] => [
  {
    id: "save",
    title: "Save",
    icon: <SaveOutlined />,
    action: () => console.log("Save clicked"),
  },
  {
    id: "download",
    title: downloadSize ? `Download Video (${downloadSize})` : "Download Video",
    icon: <DownloadOutlined />,
    disabled: isProcessing || !!!latestResponse,
    action: handleDownload,
  },
  {
    id: "modules",
    title: "Modules",
    icon: <AppsOutlined />,
    panelContent: <Modules />,
    showArrow: true,
    showAfterDivider: true,
  },
  {
    id: "upload",
    title: "Upload Module",
    icon: <UploadFileOutlined />,
    action: () => setUploadOpen(true),
    showAfterDivider: true,
  },
];

export const RIGHT_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "filtering",
    title: "Filtering",
    icon: <FilterAltOutlined />,
    action: () => console.log("Filtering clicked"),
  },
  {
    id: "metrics",
    title: "Video Quality Metrics",
    icon: <QueryStatsOutlined />,
    panelContent: (
      <div className="p-2">
        <h4 className="font-medium mb-2">Comparison Metrics</h4>
        <VideoQualityMetrics />
      </div>
    ),
    showArrow: true,
  },
];
