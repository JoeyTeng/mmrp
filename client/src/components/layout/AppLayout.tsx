"use client";
import { useState } from "react";
import { Sidebar } from "../sidebar/Sidebar";
import { Box } from "@mui/material";
import { RIGHT_SIDEBAR_ITEMS } from "../sidebar/sidebar-config";
import { useModules } from "@/hooks/useModule";
import Loading from "./Loading";
import LeftSidebar from "../sidebar/LeftSidebar";
import { useModulesContext } from "@/contexts/ModulesContext";
import { SidebarContext } from "@/contexts/SidebarContext";
import { useExamplePipelinesContext } from "@/contexts/ExamplePipelinesContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [leftOpenPanelId, setLeftOpenPanelId] = useState<string | null>(null);
  const [rightOpenPanelId, setRightOpenPanelId] = useState<string | null>(null);

  const { loading: pipelineLoading } = useExamplePipelinesContext();
  const { loading: modulesLoading } = useModules();
  const { reloadModules } = useModulesContext();

  if (modulesLoading || pipelineLoading) {
    return <Loading />;
  }

  return (
    <SidebarContext value={{ leftOpenPanelId, setLeftOpenPanelId }}>
      <Box className="flex h-screen w-screen bg-gray-50">
        <LeftSidebar
          paneId={leftOpenPanelId}
          setPaneId={setLeftOpenPanelId}
          reload={reloadModules}
        />

        <Box
          className={`flex-1 flex flex-col min-w-0 transition-all duration-400
          ${leftOpenPanelId ? "ml-[16rem] p-2" : "ml-[25px]"}
          ${rightOpenPanelId ? "mr-[16rem] p-2" : "mr-[25px]"}`}
        >
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </Box>

        <Sidebar
          anchor="right"
          items={RIGHT_SIDEBAR_ITEMS}
          openPanelId={rightOpenPanelId}
          width={45}
          onPanelToggle={setRightOpenPanelId}
        />
      </Box>
    </SidebarContext>
  );
}
