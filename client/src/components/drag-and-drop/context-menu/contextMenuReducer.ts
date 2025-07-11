import { CanvasContextAction } from "./CanvasContextMenu";
import { NodeAction } from "./NodeContextMenu";
import { ContextMenuItem } from "../types";

export type ContextMenuTarget = "canvas" | "node";

export type ContextMenuState<ActionType extends string> = {
  open: boolean;
  items: ContextMenuItem<ActionType>[];
  position: {
    x: number;
    y: number;
  };
  target: ContextMenuTarget | null;
  nodeId?: string;
};

export const initialContextMenuState: ContextMenuState<
  NodeAction | CanvasContextAction
> = {
  open: false,
  items: [],
  position: { x: 0, y: 0 },
  target: null,
};

export type ContextMenuActionPayload<ActionType extends string> = {
  items: ContextMenuItem<ActionType>[];
  position: { x: number; y: number };
  target: ContextMenuTarget;
  nodeId?: string;
};

export type ContextMenuAction<ActionType extends string> =
  | {
      type: "open";
      payload: ContextMenuActionPayload<ActionType>;
    }
  | { type: "close" };

export function contextMenuReducer<ActionType extends string>(
  state: ContextMenuState<ActionType>,
  action: ContextMenuAction<ActionType>,
) {
  switch (action.type) {
    case "open": {
      return { ...action.payload, open: true };
    }
    case "close": {
      return { ...state, open: false };
    }
    default:
      return state;
  }
}
