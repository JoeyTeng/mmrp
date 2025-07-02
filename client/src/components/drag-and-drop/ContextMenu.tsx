import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ListItemIcon, ListItemText, Divider } from "@mui/material";

import { ContextMenuItem } from "./types";
import React from "react";

interface ContextMenuProps<ActionType extends string> {
  open: boolean;
  position: {
    x: number;
    y: number;
  } | null;
  items: ContextMenuItem<ActionType>[];
  dense?: boolean;
  onAction: (action: ActionType) => void;
  onClose: () => void;
}

const ContextMenu = <ActionType extends string>({
  position,
  open,
  items,
  dense,
  onAction,
  onClose,
}: ContextMenuProps<ActionType>) => {
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
          onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
        },
      }}
    >
      {items.map((item) => [
        <MenuItem
          key={item.id}
          onClick={() => onAction(item.id)}
          disabled={item.disabled}
          dense={dense}
        >
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText className={item.color ? `text-${item.color}-700` : ""}>
            {item.label}
          </ListItemText>
        </MenuItem>,
        item.dividerAfter && <Divider key={`${item.id}-divider`} />,
      ])}
    </Menu>
  );
};

export default ContextMenu;
