import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  TooltipProps,
  Tooltip,
  Box,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { SidebarListItem } from "./types";

export const SidebarItem = ({ item, anchor }: SidebarListItem) => {
  const ITEM_PLACEMENT: Record<
    SidebarListItem["anchor"],
    TooltipProps["placement"]
  > = {
    right: "left",
    left: "right",
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={item.action}
        sx={{
          minHeight: 45,
          justifyContent: "center",
          px: 2.5,
        }}
        disabled={item.disabled}
      >
        <Tooltip
          title={item.title}
          placement={ITEM_PLACEMENT[anchor]}
          slotProps={{
            tooltip: {
              className: "bg-primary",
            },
          }}
        >
          <ListItemIcon
            className="text-primary"
            sx={{
              minWidth: 0,
              justifyContent: "center",
              position: "relative",
            }}
          >
            {item.showArrow && (
              <Box
                sx={{
                  position: "absolute",
                  [`${ITEM_PLACEMENT[anchor]}`]: -15,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {item.arrowDirection === "left" ? (
                  <ChevronLeft fontSize="small" />
                ) : (
                  <ChevronRight fontSize="small" />
                )}
              </Box>
            )}
            {item.icon}
          </ListItemIcon>
        </Tooltip>
      </ListItemButton>
    </ListItem>
  );
};
