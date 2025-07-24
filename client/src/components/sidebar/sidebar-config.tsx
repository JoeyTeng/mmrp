import {
  SaveOutlined,
  CloudUploadOutlined,
  FileDownloadOutlined,
  AppsOutlined,
  QueryStatsOutlined,
  FilterAltOutlined,
} from "@mui/icons-material";
import Modules from "../drag-and-drop/Modules";
import { SidebarItem } from "./types";
import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";

export const LEFT_SIDEBAR_ITEMS: SidebarItem[] = [
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
    action: () => console.log("Download clicked"),
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
