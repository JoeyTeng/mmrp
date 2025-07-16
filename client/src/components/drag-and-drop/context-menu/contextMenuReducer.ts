export type ContextMenuState = {
  open: boolean;
  position: {
    x: number;
    y: number;
  };
  nodeId?: string;
};

export const initialContextMenuState = {
  open: false,
  position: { x: 0, y: 0 },
};

export const initialNodeContextMenuState = {
  open: false,
  position: { x: 0, y: 0 },
  nodeId: "",
};

export type NodeContextMenuActionPayload = {
  position: { x: number; y: number };
  nodeId: string;
};

export type ContextMenuActionPayload = {
  position: { x: number; y: number };
};

export type ContextMenuAction =
  | {
      type: "open";
      payload: ContextMenuActionPayload | NodeContextMenuActionPayload;
    }
  | { type: "close" };

export function contextMenuReducer(
  state: ContextMenuState,
  action: ContextMenuAction,
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
