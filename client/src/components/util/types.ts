import { ButtonOwnProps } from "@mui/material";

type ModalOptionColor = ButtonOwnProps["color"] | "danger";

export type ModalOption<ModalActionType extends string> = {
  id: ModalActionType;
  label: string;
  disabled?: boolean;
  color?: ModalOptionColor;
  loading?: boolean;
};
