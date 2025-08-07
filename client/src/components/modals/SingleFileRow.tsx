"use client";

import { Button, Typography, Paper, Box } from "@mui/material";
import { useRef } from "react";

export default function SingleFileRow({
  label,
  file,
  accept,
  onSelect,
}: {
  label: string;
  file: File | null;
  accept?: string;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Paper variant="outlined" className="p-3 rounded-md">
      <Box className="flex items-center justify-between">
        {/* Label */}
        <Typography variant="body2" className="font-bold min-w-[10rem]">
          {label}
        </Typography>

        {/* Browse/Replace Button */}
        <Button
          size="small"
          variant="text"
          onClick={() => inputRef.current?.click()}
        >
          {file ? "Replace…" : "Browse…"}
        </Button>

        {/* File Name */}
        <Typography
          variant="body2"
          className="text-gray-500 font-mono w-[12rem] truncate text-center"
        >
          {file?.name || "No file selected"}
        </Typography>

        {/* Hidden File Input */}
        <input
          type="file"
          hidden
          ref={inputRef}
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
          }}
        />
      </Box>
    </Paper>
  );
}
