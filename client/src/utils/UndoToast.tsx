import { Box, Button } from "@mui/material";
import { toast } from "react-toastify/unstyled";

export function showUndoToast(
  message: string,
  undoMessage: string,
  enableUndo: boolean,
  onUndo: () => void,
) {
  toast.success(
    ({ closeToast }) => (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span>{message}</span>
        {enableUndo && (
          <Button
            onClick={() => {
              closeToast();
              onUndo();
              toast.info(undoMessage);
            }}
            size="small"
            sx={{ border: "1px solid" }}
          >
            Undo
          </Button>
        )}
      </Box>
    ),
    {
      closeOnClick: false,
    },
  );
}
