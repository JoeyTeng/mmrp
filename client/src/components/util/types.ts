import { ButtonOwnProps } from "@mui/material";

export type ContextMenuItem<ActionType extends string> = {
  id: ActionType;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  dividerAfter?: boolean;
  submenu?: ContextMenuItem<ActionType>[];
  danger?: boolean;
};

type ModalOptionColor = ButtonOwnProps["color"] | "danger";

export type ModalOption<ModalActionType extends string> = {
  id: ModalActionType;
  label: string;
  disabled?: boolean;
  color?: ModalOptionColor;
  loading?: boolean;
};

export type GenericModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  title: string;
  content?: React.ReactNode;
  loading?: boolean;
};
