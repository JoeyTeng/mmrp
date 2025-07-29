"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { DownloadOutlined } from "@mui/icons-material";
import { toast } from "react-toastify/unstyled";
import { useState } from "react";
import SingleFileRow from "./SingleFileRow";
import DualFileRow from "./DualFileRow";
import { uploadBinaryToBackend } from "@/services/binaryService";

export default function UploadBinaryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<{
    config: File | null;
    darwin: { exec: File | null; lib: File | null };
    linux: { exec: File | null; lib: File | null };
    windows: { exec: File | null; lib: File | null };
  }>({
    config: null,
    darwin: { exec: null, lib: null },
    linux: { exec: null, lib: null },
    windows: { exec: null, lib: null },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    // Clear all files
    setFiles({
      config: null,
      darwin: { exec: null, lib: null },
      linux: { exec: null, lib: null },
      windows: { exec: null, lib: null },
    });

    // Close modal
    onClose();
  };

  // Handle form submission and upload files to backend
  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!files.config) missing.push("config.json");

    // Check each OS group for missing files
    (["darwin", "linux", "windows"] as const).forEach((os) => {
      const osFiles = files[os];
      if (!osFiles.exec) missing.push(`${os} executable`);
      if (!osFiles.lib) missing.push(`${os} library`);
    });
    if (missing.length) {
      toast.error(`Missing file(s):\n- ${missing.join("\n- ")}`);
      return;
    }

    // Create FormData to send files to backend
    const formData = new FormData();
    formData.append("config", files.config!);

    // Append both exec + lib for each OS
    formData.append("darwin_exec", files.darwin.exec!);
    formData.append("darwin_lib", files.darwin.lib!);
    formData.append("linux_exec", files.linux.exec!);
    formData.append("linux_lib", files.linux.lib!);
    formData.append("windows_exec", files.windows.exec!);
    formData.append("windows_lib", files.windows.lib!);

    // TODO: Validate files (check json content and structure, check binaries?)
    // TODO: Send request to backend
    setIsLoading(true);
    try {
      const res = await uploadBinaryToBackend(formData);
      console.log("Upload response:", res);
      setIsLoading(false);
      toast.success("Modules uploaded successfully!");
      handleClose();
    } catch (error) {
      toast.error("Upload failed. " + error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Upload a New Processing Module</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To upload a new processing module, you must must include the necessary
          files for each Operating System: macOS, Linux, Windows.
        </DialogContentText>
        <DialogContentText>
          Please include a{" "}
          <Button
            variant="text"
            size="small"
            component="a"
            href="/config_template.json"
            download="config_template.json"
            className="font-mono normal-case p-0 min-w-0"
          >
            config.json <DownloadOutlined fontSize="small" />
          </Button>{" "}
          file to describe the module&apos;s parameters.
        </DialogContentText>

        <Box className="flex flex-col gap-2 mt-2">
          <SingleFileRow
            label="Config file (.json)"
            file={files.config}
            accept=".json"
            onSelect={(f) => setFiles((prev) => ({ ...prev, config: f }))}
          />

          <DualFileRow
            label="Darwin (macOS)"
            files={files.darwin}
            acceptLib=".dylib"
            onFileSelect={(type, f) =>
              setFiles((prev) => ({
                ...prev,
                darwin: { ...prev.darwin, [type]: f },
              }))
            }
          />

          <DualFileRow
            label="Linux"
            files={files.linux}
            acceptLib=".so"
            onFileSelect={(type, f) =>
              setFiles((prev) => ({
                ...prev,
                linux: { ...prev.linux, [type]: f },
              }))
            }
          />

          <DualFileRow
            label="Windows"
            files={files.windows}
            acceptExec=".exe"
            acceptLib=".dll"
            onFileSelect={(type, f) =>
              setFiles((prev) => ({
                ...prev,
                windows: { ...prev.windows, [type]: f },
              }))
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Box className="flex justify-end gap-2 mb-1 mr-1">
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className={isLoading ? "bg-gray-200 text-gray-100" : "bg-primary"}
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Confirm
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
