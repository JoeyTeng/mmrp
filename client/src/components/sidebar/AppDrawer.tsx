"use client";

import { Drawer, Typography, Box } from "@mui/material";

import { AppDrawerProps } from "./types";

export const AppDrawer = ({
  open,
  onClose,
  title,
  width = 400,
  children,
  anchor = "right",
  headerSx,
  contentSx,
  elevation = 12,
  zIndex = 1300,
}: AppDrawerProps) => {
  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      elevation={elevation}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          p: 2,
          zIndex,
        },
      }}
      slotProps={{
        backdrop: {
          onClick: (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          sx: {
            pointerEvents: "none",
          },
        },
      }}
      ModalProps={{
        disableEscapeKeyDown: true,
        BackdropComponent: ({}) => (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: zIndex - 1,
              pointerEvents: "auto",
            }}
          />
        ),
      }}
    >
      <Box className="h-full flex flex-col">
        {title && (
          <Box className="flex justify-between items-center mb-4" sx={headerSx}>
            {title && (
              <Typography variant="h6" className="capitalize text-primary">
                {title}
              </Typography>
            )}
          </Box>
        )}
        <Box className="flex-1 overflow-y-auto" sx={contentSx}>
          {children}
        </Box>
      </Box>
    </Drawer>
  );
};
