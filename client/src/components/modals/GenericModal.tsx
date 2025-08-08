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
import { GenericModalProps } from "./types";

export const GenericModal = ({
  open,
  onClose,
  onSubmit,
  children,
  title,
  content = null,
  loading = false,
}: GenericModalProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
        {children}
      </DialogContent>
      <DialogActions>
        <Box className="flex justify-end gap-2 mb-1 mr-1">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={loading ? "bg-gray-200 text-gray-100" : "bg-primary"}
            variant="contained"
            type="submit"
            onClick={onSubmit}
            loading={loading}
          >
            Confirm
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
