"use client";
import { Drawer, List, Divider, Box } from "@mui/material";
import { SidebarItem } from "./SidebarItem";
import { SidebarPanel } from "./SidebarPanel";
import { SidebarProps } from "./types";

export const Sidebar = ({
  anchor = "left",
  width = 45,
  items,
  openPanelId,
  onPanelToggle,
}: SidebarProps) => {
  const togglePanel = (panelId: string) => {
    const newPanelId = openPanelId === panelId ? null : panelId;
    onPanelToggle?.(newPanelId);
  };

  const getSectionedItems = () => {
    return {
      beforeDivider: items.filter((item) => !item.showAfterDivider),
      afterDivider: items.filter((item) => item.showAfterDivider),
    };
  };

  const { beforeDivider, afterDivider } = getSectionedItems();

  return (
    <>
      <Drawer
        variant="permanent"
        anchor={anchor}
        sx={{
          width,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width,
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            boxShadow: openPanelId
              ? 0
              : `${anchor === "left" ? "4px" : "-4px"} 0 16px 2px rgba(0,0,0,0.1)`,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Box className="relative flex-1 my-auto">
            <List>
              {/* Items before divider */}
              {beforeDivider.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={{
                    ...item,
                    action: item.action || (() => togglePanel(item.id)),
                    arrowDirection: openPanelId === item.id ? "left" : "right",
                  }}
                  anchor={anchor}
                />
              ))}
            </List>
          </Box>

          <Box className="flex-1 relative my-auto">
            {/* Divider (only if we have after-divider items) */}
            {afterDivider.length > 0 && <Divider />}
            {/* Items after divider */}
            <List>
              {afterDivider.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={{
                    ...item,
                    action: item.action || (() => togglePanel(item.id)),
                    arrowDirection: openPanelId === item.id ? "left" : "right",
                  }}
                  anchor={anchor}
                />
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* Render active panels */}
      {items
        .filter((item) => item.panelContent)
        .map((item) => (
          <SidebarPanel
            key={item.id}
            open={openPanelId === item.id}
            onClose={() => togglePanel(item.id)}
            title={item.title}
            anchor={anchor}
            drawerWidth={width}
            width={256}
          >
            {item.panelContent}
          </SidebarPanel>
        ))}
    </>
  );
};
