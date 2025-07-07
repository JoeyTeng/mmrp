let ws: WebSocket | null = null;

export type FrameMessage =
  | {
      fps?: number;
      mime?: string;
      count?: number;
    }
  | ArrayBuffer;

export const createVideoWebSocket = (
  onMessage: (msg: FrameMessage) => void,
  onOpen?: () => void,
  onError?: (err: Event) => void,
  onClose?: () => void,
  initMessage?: object,
): WebSocket => {
  const url = `${process.env.NEXT_PUBLIC_WS_API_URL}/video`;
  ws ??= new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    console.log("WebSocket connection opened");
    if (initMessage) {
      ws?.send(JSON.stringify(initMessage)); // send mode info
    }
    onOpen?.();
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    onError?.(err);
  };

  ws.onmessage = (event) => {
    if (typeof event.data === "string") {
      try {
        const meta = JSON.parse(event.data);
        onMessage(meta);
      } catch (e) {
        console.error("Invalid metadata JSON", e);
      }
    } else {
      onMessage(event.data);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    onClose?.();
  };

  return ws;
};

export const closeVideoWebSocket = () => {
  if (ws?.CLOSED || ws?.CLOSING) return;
  ws?.close();
  ws = null;
};
