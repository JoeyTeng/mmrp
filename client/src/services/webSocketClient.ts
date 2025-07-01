let ws: WebSocket | null = null;

export type FrameMessage =
  | {
      fps?: number;
      mime?: string;
    }
  | ArrayBuffer;

export const createVideoWebSocket = (
  onMessage: (msg: FrameMessage) => void,
  onOpen?: () => void,
  onError?: (err: Event) => void,
  onClose?: () => void,
): WebSocket => {
  const url = `${process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws")}/ws/video`;
  ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    console.log("WebSocket connection opened");
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
  ws?.close();
};
