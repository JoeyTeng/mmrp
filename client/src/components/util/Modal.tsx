import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { ModalOption } from "./types";
import { useId } from "react";

interface ModalProps<ModalActionType extends string> {
  open: boolean;
  title: string;
  description: string | string[];
  options: ModalOption<ModalActionType>[];
  onAction: (action: ModalActionType) => void;
  onClose: () => void;
}

const Modal = <ModalActionType extends string>({
  open,
  title,
  description,
  options,
  onAction,
  onClose,
}: ModalProps<ModalActionType>) => {
  const ariaId = useId();
  const descriptionLines = Array.isArray(description)
    ? description
    : [description];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={`${ariaId}-title`}
      aria-describedby={`${ariaId}-description`}
    >
      <DialogTitle id={`${ariaId}-title`}>{title}</DialogTitle>
      <DialogContent id={`${ariaId}-description`}>
        {descriptionLines.map((line, index) => (
          <DialogContentText key={index}>{line}</DialogContentText>
        ))}
      </DialogContent>
      <DialogActions>
        {options.map((option) => (
          <Button
            key={option.id}
            disabled={!!option.disabled}
            color={
              option.color && option.color !== "danger"
                ? option.color
                : undefined
            }
            className={option.color === "danger" ? "text-red-700" : undefined}
            loading={option.loading}
            onClick={() => onAction(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
