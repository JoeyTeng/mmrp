import {
  Add,
  DeleteOutlined,
  FileDownloadOutlined,
  PlayCircle,
} from "@mui/icons-material";
import { ContextMenuItem } from "@/components/util/types";

export type CanvasContextAction = "clear" | "export" | "run" | "add_node";

export const getCanvasContextMenu = (
  isProcessing: boolean,
): ContextMenuItem<CanvasContextAction>[] => [
  {
    id: "add_node",
    label: "Add Module",
    icon: <Add />,
  },
  {
    id: "run",
    label: "Run",
    icon: <PlayCircle />,
    dividerAfter: true,
    disabled: isProcessing,
  },
  {
    id: "export",
    label: "Export Pipeline",
    icon: <FileDownloadOutlined />,
    dividerAfter: true,
  },
  {
    id: "clear",
    label: "Delete All",
    icon: <DeleteOutlined className="fill-red-700" />,
    danger: true,
  },
];
