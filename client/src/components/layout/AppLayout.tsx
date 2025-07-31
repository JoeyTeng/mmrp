"use client";
import { useState } from "react";
import { Sidebar } from "../sidebar/Sidebar";
import { Box } from "@mui/material";
import {
  getLeftSidebarItems,
  RIGHT_SIDEBAR_ITEMS,
} from "../sidebar/sidebar-config";
import { ModulesContext } from "@/contexts/ModulesContext";
import { useModules } from "@/hooks/useModule";
import { useVideoReload } from "@/contexts/videoReloadContext";
import Loading from "./Loading";
import UploadBinaryModal from "../modals/UploadBinaryModal";
import { useDownloadUtils } from "../sidebar/util";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [leftOpenPanelId, setLeftOpenPanelId] = useState<string | null>(null);
  const [rightOpenPanelId, setRightOpenPanelId] = useState<string | null>(null);
  const { modules, loading, reloadModules } = useModules();
  const [uploadOpen, setUploadOpen] = useState(false);
  const { latestResponse, isProcessing } = useVideoReload();
  const { handleDownload, downloadSize } = useDownloadUtils();

  if (loading) {
    return <Loading />;
  }

  return (
    <ModulesContext value={modules}>
      <Box className="flex h-screen w-screen bg-gray-50">
        <Sidebar
          anchor="left"
          items={getLeftSidebarItems(
            setUploadOpen,
            handleDownload,
            downloadSize,
            isProcessing,
            latestResponse,
          )}
          openPanelId={leftOpenPanelId}
          width={45}
          onPanelToggle={setLeftOpenPanelId}
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

        <UploadBinaryModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploadSuccess={reloadModules}
        />
      </Box>
    </ModulesContext>
  );
}
