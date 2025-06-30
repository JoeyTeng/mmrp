import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
  EditOutlined as EditIcon,
  FileCopyOutlined as DuplicateIcon,
  DeleteOutlined as DeleteIcon,
  SettingsOutlined as SettingsIcon,
  OpenInFullOutlined as OpenInFullIcon,
  PaletteOutlined as PaletteIcon,
  FileDownloadOutlined as FileDownloadIcon,
} from "@mui/icons-material";

import { NodeAction } from "./types";

interface NodeContextMenuProps {
  position: {
    x: number;
    y: number;
  } | null;
  open: boolean;
  onAction: (action: NodeAction) => void;
  onClose: () => void;
}

const ContextMenu = ({
  position,
  open,
  onAction,
  onClose,
}: NodeContextMenuProps) => {
  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position ? { top: position.y - 6, left: position.x + 2 } : undefined
      }
      slotProps={{
        list: {
          onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        },
      }}
    >
      <MenuItem dense onClick={() => onAction(NodeAction.Expand)}>
        <ListItemIcon>
          <OpenInFullIcon />
        </ListItemIcon>
        <ListItemText>Expand</ListItemText>
      </MenuItem>
      <MenuItem dense onClick={() => onAction(NodeAction.Duplicate)}>
        <ListItemIcon>
          <DuplicateIcon />
        </ListItemIcon>
        <ListItemText>Duplicate</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem dense onClick={() => onAction(NodeAction.Rename)}>
        <ListItemIcon>
          <EditIcon />
        </ListItemIcon>
        <ListItemText>Rename</ListItemText>
      </MenuItem>
      <MenuItem dense onClick={() => onAction(NodeAction.Configure)}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText>Configure</ListItemText>
      </MenuItem>
      <MenuItem dense>
        <ListItemIcon>
          <PaletteIcon />
        </ListItemIcon>
        <ListItemText>Colour</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem dense onClick={() => onAction(NodeAction.Export)}>
        <ListItemIcon>
          <FileDownloadIcon />
        </ListItemIcon>
        <ListItemText>Export</ListItemText>
      </MenuItem>
      <MenuItem dense onClick={() => onAction(NodeAction.Delete)}>
        <ListItemIcon>
          <DeleteIcon />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
