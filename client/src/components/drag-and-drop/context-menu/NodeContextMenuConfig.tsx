import { ContextMenuItem } from "@/components/util/types";
import {
  OpenInFullOutlined,
  FileCopyOutlined,
  DeleteOutlined,
  SettingsOutlined,
  EditOutlined,
  PaletteOutlined,
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

/** The disabled menu items are to be left in to be implemented in future iterations. */

export const NODE_CONTEXT_MENU: ContextMenuItem<NodeAction>[] = [
  {
    id: "expand",
    label: "Expand",
    icon: <OpenInFullOutlined />,
    disabled: true,
  },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: <FileCopyOutlined />,
    dividerAfter: true,
    disabled: true,
  },
  {
    id: "rename",
    label: "Rename",
    icon: <EditOutlined />,
    disabled: true,
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
    disabled: true,
  },
  {
    id: "export",
    label: "Export",
    icon: <FileDownloadOutlined />,
    disabled: true,
  },
  {
    id: "delete",
    label: "Delete",
    icon: <DeleteOutlined className="fill-red-700" />,
    danger: true,
  },
];
