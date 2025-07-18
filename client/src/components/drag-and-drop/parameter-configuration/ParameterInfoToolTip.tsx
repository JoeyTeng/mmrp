import { InfoOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ParameterInfoToolTipProps } from "../types";

export default function ParameterInfoToolTip({
  description,
}: ParameterInfoToolTipProps) {
  if (!description) return <Box sx={{ width: 24, height: 24 }} />; // placeholder
  return (
    <Tooltip title={description} placement="top">
      <IconButton
        size="small"
        edge="end"
        sx={{
          p: 0,
          ml: 1,
          "& .MuiSvgIcon-root": {
            fontSize: "1em", // shrink the SVG down to text‑size
          },
        }}
      >
        <InfoOutlined fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
