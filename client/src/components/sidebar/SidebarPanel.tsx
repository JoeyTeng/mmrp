import { Paper, Typography, IconButton, Box } from "@mui/material";
import { Close } from "@mui/icons-material";
import { SidebarPanelProps } from "./types";

export const SidebarPanel = ({
  open,
  onClose,
  title,
  width = 256,
  drawerWidth,
  anchor,
  children,
  zIndex = 20,
}: SidebarPanelProps) => {
  if (!open) return null;
  return (
    <Paper
      elevation={12}
      square={false}
      sx={{
        position: "fixed",
        top: 0,
        [anchor]: drawerWidth,
        width,
        height: "100vh",
        zIndex,
      }}
    >
      <Box className="p-4 h-full flex flex-col">
        <Box className="flex justify-between items-center mb-4 text-primary">
          <Typography variant="h6" className="capitalize text-primary">
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Box className="flex-1 overflow-y-auto mt-2 space-y-2 flex flex-col items-center">
          {children}
        </Box>
      </Box>
    </Paper>
  );
};
