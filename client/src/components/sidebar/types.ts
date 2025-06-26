import { SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

export type SidebarAnchor = "left" | "right";

export interface SidebarProps {
  anchor?: SidebarAnchor;
  items: SidebarItem[];
  openPanelId?: string | null;
  width?: number;
  onPanelToggle?: (panelId: string | null) => void;
}

export interface SidebarItem {
  id: string;
  title: string;
  icon: ReactNode;
  action?: () => void;
  panelContent?: ReactNode;
  showArrow?: boolean;
  showAfterDivider?: boolean;
  arrowDirection?: "left" | "right";
}

export interface SidebarListItem {
  item: SidebarItem;
  anchor: SidebarAnchor;
}

export interface SidebarPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  drawerWidth: number;
  zIndex?: number;
  anchor: SidebarAnchor;
  children: ReactNode;
}

export type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: React.ReactNode;
  anchor?: "left" | "right" | "top" | "bottom";
  zIndex?: number;
  sx?: SxProps<Theme>;
  elevation?: number;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};
