"use client";

import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";

export default function Loading() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
        transition: "opacity 0.5s ease-out",
      }}
    >
      <CircularProgress
        size={80}
        thickness={4}
        sx={{
          color: "var(--primary)",
          mb: 2,
          transition: "all 0.3s ease",
        }}
      />
    </Box>
  );
}
