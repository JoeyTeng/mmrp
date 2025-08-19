"use client";

import { useVideoReload } from "@/contexts/VideoReloadContext";
import { useDownloadUtils } from "../sidebar/util";
import { usePipelineExport } from "../sidebar/util";
import { getLeftSidebarItems } from "./sidebar-config";
import { Sidebar } from "./Sidebar";
import { Dispatch, SetStateAction, useState } from "react";
import { Box } from "@mui/material";
import UploadBinaryModal from "../modals/UploadBinaryModal";

export default function LeftSidebar({
  paneId,
  setPaneId,
  reload,
}: {
  paneId: string | null;
  setPaneId: Dispatch<SetStateAction<string | null>>;
  reload: () => void;
}) {
  const { latestResponse, isProcessing } = useVideoReload();
  const { handleDownload, downloadSize } = useDownloadUtils();
  const { handleImportPipeline, handleExportPipeline } = usePipelineExport();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <Box>
      <Sidebar
        anchor="left"
        items={getLeftSidebarItems(
          setUploadOpen,
          handleDownload,
          handleImportPipeline,
          handleExportPipeline,
          downloadSize,
          isProcessing,
          latestResponse,
        )}
        openPanelId={paneId}
        width={45}
        onPanelToggle={setPaneId}
      />

      <UploadBinaryModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={reload}
      />
    </Box>
  );
}
