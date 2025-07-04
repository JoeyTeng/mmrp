import {
  OpenInFullOutlined,
  FileCopyOutlined,
  DeleteOutlined,
  SettingsOutlined,
  EditOutlined,
  PaletteOutlined,
  FileDownloadOutlined,
} from "@mui/icons-material";
import type { ContextMenuItem } from "./types";

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
    id: "expand",
    label: "Expand",
    icon: <OpenInFullOutlined />,
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: <FileCopyOutlined />,
    dividerAfter: true,
  },
  {
    id: "rename",
    label: "Rename",
    icon: <EditOutlined />,
  },
  {
    id: "configure",
    label: "Configure",
    icon: <SettingsOutlined />,
  },
  {
    id: "color",
    label: "Colour",
    icon: <PaletteOutlined />,
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
