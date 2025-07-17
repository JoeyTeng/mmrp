"use client";

import { useState } from "react";
import {
  Menu,
  MenuItem,
  Button,
  ListItemText,
  Box,
  ListSubheader,
} from "@mui/material";
import { MenuOutlined } from "@mui/icons-material";
import { MenuDropdownProps, VideoType, ViewOptions } from "./types";

const MenuDropdown = ({ onSelect }: MenuDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelection = (view: ViewOptions, type: VideoType) => {
    onSelect({ view, type });
    handleClose();
  };

  return (
    <Box>
      <Button
        size="small"
        onClick={handleClick}
        sx={{ color: "white", "&:hover": { color: "gray.300" } }}
      >
        <MenuOutlined />
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <ListSubheader sx={{ fontSize: "0.875rem", lineHeight: "2" }}>
          Select view:
        </ListSubheader>
        {Object.values(ViewOptions).map((view) => (
          <Box key={view}>
            <MenuItem onClick={() => handleSelection(view, VideoType.Video)}>
              <ListItemText>{`${view} - Video`}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleSelection(view, VideoType.Stream)}>
              <ListItemText>{`${view} - Stream`}</ListItemText>
            </MenuItem>
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

export default MenuDropdown;
