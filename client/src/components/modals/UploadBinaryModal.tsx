"use client";

import { Button, Box } from "@mui/material";
import { FileOpenOutlined } from "@mui/icons-material";
import { toast } from "react-toastify/unstyled";
import { useState } from "react";
import SingleFileRow from "./SingleFileRow";
import DualFileRow from "./DualFileRow";
import { uploadBinaryToBackend } from "@/services/binaryService";
import { GenericModal } from "./GenericModal";
import { handleError } from "@/utils/sharedFunctionality";
import { CopyableToast } from "@/utils/CopyableToast";

export default function UploadBinaryModal({
  open,
  onClose,
  onUploadSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
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
    setIsLoading(false);
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
      toast.error(
        <CopyableToast
          message={`Missing file(s):\n- ${missing.join("\n- ")}`}
        />,
      );
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

    setIsLoading(true);
    try {
      const res = await uploadBinaryToBackend(formData);
      if (res) {
        onUploadSuccess();
        handleClose();
      }
      // Error in validation --> res == false
      if (!res) {
        toast.error(
          <CopyableToast
            message={
              "The config file does not follow the required structure. (See template)"
            }
          />,
        );
      }
    } catch (error) {
      toast.error(<CopyableToast message={handleError(error)} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GenericModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Upload Binary Modules"
      content={
        <>
          To upload a new processing module, you must include the necessary
          files for each Operating System: macOS, Linux, Windows.
          <br />
          Please include a{" "}
          <Button
            variant="text"
            size="medium"
            component="a"
            href="/config_template.json"
            download="config_template.json"
            className="p-0.5 normal-case font-mono align-baseline"
          >
            config.json <FileOpenOutlined fontSize="small" />
          </Button>{" "}
          file to describe the module&apos;s parameters.
        </>
      }
      loading={isLoading}
    >
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
    </GenericModal>
  );
}
