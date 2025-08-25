"use client";
import { Drawer, List, Divider, Box } from "@mui/material";
import { SidebarItem as SideBarItemComponent } from "./SidebarItem";
import { SidebarPanel } from "./SidebarPanel";
import { SidebarItem, SidebarProps } from "./types";

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

  const groupItemsBySection = () => {
    const grouped: Record<number, SidebarItem[]> = {};

    items.forEach((item) => {
      const section = item.section ?? 0; // default to section 0
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    });

    return grouped;
  };
  const groupedItems = groupItemsBySection();
  const sectionKeys = Object.keys(groupedItems)
    .map(Number)
    .sort((a, b) => a - b);

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
          {sectionKeys.map((sectionKey, index) => (
            <Box key={sectionKey} className="relative flex-1 my-auto">
              {/* Divider before all except the first */}
              {index > 0 && <Divider />}

              <List>
                {groupedItems[sectionKey].map((item) => (
                  <SideBarItemComponent
                    key={item.id}
                    item={{
                      ...item,
                      action: item.action || (() => togglePanel(item.id)),
                      arrowDirection:
                        openPanelId === item.id ? "right" : "left",
                    }}
                    anchor={anchor}
                  />
                ))}
              </List>
            </Box>
          ))}
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
