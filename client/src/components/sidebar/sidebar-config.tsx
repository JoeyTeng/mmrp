import {
  QueryStatsOutlined,
  FilterAltOutlined,
  UploadFileOutlined,
  AppsOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  AddAPhotoOutlined,
} from "@mui/icons-material";
import { SidebarItem } from "./types";
import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";
import Modules from "../drag-and-drop/Modules";
import { PipelineResponse } from "@/types/pipeline";

export const getLeftSidebarItems = (
  setUploadOpen: (open: boolean) => void,
  handleDownload: () => void,
  handleImportPipeline: () => void,
  handleExportPipeline: () => void,
  handleUploadVideo: () => void,
  downloadSize: string,
  isProcessing: boolean,
  latestResponse: PipelineResponse | null,
): SidebarItem[] => [
  // Video Operations Section
  {
    id: "video-upload",
    title: "Upload Video",
    icon: <AddAPhotoOutlined />,
    action: handleUploadVideo,
  },
  {
    id: "video-download",
    title: downloadSize ? `Download Video (${downloadSize})` : "Download Video",
    icon: <DownloadOutlined />,
    disabled: isProcessing || !!!latestResponse,
    action: handleDownload,
  },
  // Pipeline Operations Section
  {
    id: "pipeline-import",
    title: "Import Pipeline",
    icon: <CloudUploadOutlined />,
    action: handleImportPipeline,
  },
  {
    id: "pipeline-export",
    title: "Export Pipeline",
    icon: <CloudDownloadOutlined />,
    action: handleExportPipeline,
  },
  // Modules
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
