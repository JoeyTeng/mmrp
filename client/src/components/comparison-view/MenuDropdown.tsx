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
import { MenuDropdownProps, ViewOptions } from "./types";
import { useVideoReload } from "@/contexts/VideoReloadContext";

const MenuDropdown = ({ onSelect }: MenuDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { isPipelineRun, videoShapesMismatch } = useVideoReload();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelection = (view: ViewOptions) => {
    onSelect(view);
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
        {Object.values(ViewOptions).map((option) => {
          const disabled =
            option === ViewOptions.Interleaving &&
            (!isPipelineRun || videoShapesMismatch);
          return (
            <MenuItem
              dense
              key={option}
              onClick={() => !disabled && handleSelection(option)}
              disabled={disabled}
            >
              <ListItemText>{option}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default MenuDropdown;
