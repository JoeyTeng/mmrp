"use client";

import { Button, Typography, Paper, Box } from "@mui/material";
import { useRef } from "react";

export default function DualFileRow({
  label,
  files,
  onFileSelect,
  acceptExec,
  acceptLib,
}: {
  label: string;
  files: { exec: File | null; lib: File | null };
  onFileSelect: (type: "exec" | "lib", file: File) => void;
  acceptExec?: string;
  acceptLib?: string;
}) {
  const execRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);

  return (
    <Paper variant="outlined" className="p-3 rounded-md">
      <Box className="flex flex-col w-full">
        {/* OS label (e.g. Darwin/macOS) */}
        <Typography variant="body2" className="font-bold min-w-[10rem]">
          {label}
        </Typography>

        <Box className="flex flex-col w-full">
          {/* Executable Upload */}
          <Box className="flex items-center justify-between w-full">
            <Typography variant="caption" className="font-medium min-w-[10rem]">
              Executable:
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => execRef.current?.click()}
            >
              {files.exec ? "Replace…" : "Browse…"}
            </Button>
            <Typography
              variant="body2"
              className="text-gray-500 font-mono w-[12rem] truncate text-center"
            >
              {files.exec?.name || "No file selected"}
            </Typography>
            <input
              type="file"
              hidden
              accept={acceptExec}
              ref={execRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect("exec", f);
              }}
            />
          </Box>

          {/* Library Upload */}
          <Box className="flex items-center justify-between w-full">
            <Typography variant="caption" className="font-medium min-w-[10rem]">
              Library:
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => libRef.current?.click()}
            >
              {files.lib ? "Replace…" : "Browse…"}
            </Button>
            <Typography
              variant="body2"
              className="text-gray-500 font-mono w-[12rem] truncate text-center"
            >
              {files.lib?.name || "No file selected"}
            </Typography>
            <input
              type="file"
              hidden
              accept={acceptLib}
              ref={libRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect("lib", f);
              }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
