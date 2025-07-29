import { QueryStatsOutlined, FilterAltOutlined } from "@mui/icons-material";
import { SidebarItem } from "./types";
import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";

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
