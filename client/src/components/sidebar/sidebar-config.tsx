import {
  QueryStatsOutlined,
  UploadFileOutlined,
  AppsOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  LibraryAdd,
} from "@mui/icons-material";
import { SidebarItem } from "./types";
import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";
import Modules from "../drag-and-drop/Modules";
import { PipelineResponse } from "@/types/pipeline";
import ExamplePipelines from "../drag-and-drop/ExamplePipelines";

export const getLeftSidebarItems = (
  setUploadOpen: (open: boolean) => void,
  handleDownload: () => void,
  handleImportPipeline: () => void,
  handleExportPipeline: () => void,
  downloadSize: string,
  isProcessing: boolean,
  latestResponse: PipelineResponse | null,
): SidebarItem[] => [
  {
    id: "download",
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
    section: 1,
  },
  {
    id: "pipeline-export",
    title: "Export Pipeline",
    icon: <CloudDownloadOutlined />,
    action: handleExportPipeline,
    section: 1,
  },
  {
    id: "example-pipelines",
    title: "Example Pipelines",
    icon: <LibraryAdd />,
    panelContent: <ExamplePipelines />,
    section: 1,
  },
  // Modules
  {
    id: "modules",
    title: "Modules",
    icon: <AppsOutlined />,
    panelContent: <Modules />,
    showArrow: true,
    section: 2,
  },
  {
    id: "upload",
    title: "Upload Module",
    icon: <UploadFileOutlined />,
    action: () => setUploadOpen(true),
    section: 2,
  },
];

export const RIGHT_SIDEBAR_ITEMS: SidebarItem[] = [
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
