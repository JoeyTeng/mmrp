import { ModalOption } from "@/components/util/types";

export type CanvasModalAction = "cancel" | "delete";

export const CANVAS_MODAL_OPTIONS: ModalOption<CanvasModalAction>[] = [
  {
    id: "cancel",
    label: "Cancel",
  },
  {
    id: "delete",
    label: "Delete",
    color: "danger",
  },
];
