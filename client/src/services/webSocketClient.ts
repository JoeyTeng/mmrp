import { Metrics } from "@/types/metrics";

let ws: WebSocket | null = null;

export type FrameMessage =
  | {
      fps?: number;
      mime?: string;
      metrics?: Metrics;
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
      ws?.send(JSON.stringify(initMessage)); // send filenames info
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
    onClose?.();
  };

  return ws;
};

export const closeVideoWebSocket = () => {
  if (ws && ws.readyState === WebSocket.CONNECTING) {
    console.log("WebSocket connecting");
    return;
  }
  console.log("WebSocket closing");
  ws?.close();
  ws = null;
};
