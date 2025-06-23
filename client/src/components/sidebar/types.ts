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
  anchor: SidebarAnchor;
  children: ReactNode;
}
