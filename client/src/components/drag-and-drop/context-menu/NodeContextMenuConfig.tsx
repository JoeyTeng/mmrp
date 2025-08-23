import { ContextMenuItem } from "@/components/util/types";
import {
  FileCopyOutlined,
  DeleteOutlined,
  SettingsOutlined,
  FileDownloadOutlined,
} from "@mui/icons-material";

export type NodeAction =
  | "expand"
  | "duplicate"
  | "rename"
  | "color"
  | "configure"
  | "export"
  | "delete";

export const NODE_CONTEXT_MENU: ContextMenuItem<NodeAction>[] = [
  {
    id: "duplicate",
    label: "Duplicate",
    icon: <FileCopyOutlined />,
  },

  {
    id: "configure",
    label: "Configure",
    icon: <SettingsOutlined />,
    dividerAfter: true,
  },
  {
    id: "export",
    label: "Export",
    icon: <FileDownloadOutlined />,
  },
  {
    id: "delete",
    label: "Delete",
    icon: <DeleteOutlined className="fill-red-700" />,
    danger: true,
  },
];

export const NODE_SELECTION_CONTEXT_MENU: ContextMenuItem<NodeAction>[] = [
  {
    id: "duplicate",
    label: "Duplicate",
    icon: <FileCopyOutlined />,
    dividerAfter: true,
  },
  {
    id: "export",
    label: "Export",
    icon: <FileDownloadOutlined />,
  },
  {
    id: "delete",
    label: "Delete",
    icon: <DeleteOutlined className="fill-red-700" />,
    danger: true,
  },
];
