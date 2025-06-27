import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface Props {
  moduleTitle: string;
  isBreakingChange: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const DeleteModal = ({
  moduleTitle,
  isBreakingChange,
  onCancel,
  onDelete,
}: Props) => {
  return (
    <Dialog
      open
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">{`Delete "${moduleTitle}"?`}</DialogTitle>
      <DialogContent id="delete-dialog-description">
        <DialogContentText>
          Are you sure you want to delete this module?
        </DialogContentText>
        {isBreakingChange && (
          <DialogContentText>
            Deleting this module will break one or more pipeline flow(s).
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus>
          Cancel
        </Button>
        <Button onClick={onDelete} className="text-red-700">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteModal;
