import { createContext } from "react";

type SidebarContextValue = {
  leftOpenPanelId: string | null;
  setLeftOpenPanelId: (id: string | null) => void;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);
