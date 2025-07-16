import {
  Add,
  DeleteOutlined,
  FileDownloadOutlined,
  PlayCircle,
} from "@mui/icons-material";
import { ContextMenuItem } from "../types";

export type CanvasContextAction = "clear" | "export" | "run" | "add_node";

export const CANVAS_CONTEXT_MENU: ContextMenuItem<CanvasContextAction>[] = [
  {
    id: "add_node",
    label: "Add Module",
    icon: <Add />,
    disabled: true,
  },
  {
    id: "run",
    label: "Run",
    icon: <PlayCircle />,
    dividerAfter: true,
  },
  {
    id: "export",
    label: "Export Pipeline",
    icon: <FileDownloadOutlined />,
    dividerAfter: true,
    disabled: true,
  },
  {
    id: "clear",
    label: "Delete All",
    icon: <DeleteOutlined className="fill-red-700" />,
    danger: true,
  },
];
