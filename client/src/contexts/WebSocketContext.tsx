"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Metrics } from "@/types/metrics";

export type FrameMessage =
  | {
      fps: number;
      mime: string;
      metrics: Metrics;
    }
  | ArrayBuffer;

type WebSocketContextType = {
  createConnection: (
    onMessage: (msg: FrameMessage) => void,
    onOpen?: () => void,
    onError?: (err: Event) => void,
    onClose?: () => void,
    initMessage?: object,
  ) => void;
  closeConnection: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const wsRef = useRef<WebSocket | null>(null);

  const createConnection: WebSocketContextType["createConnection"] =
    useCallback((onMessage, onOpen, onError, onClose, initMessage) => {
      const existing = wsRef.current;

      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_WS_API_URL}/video`;
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection opened");
        if (initMessage) {
          ws.send(JSON.stringify(initMessage));
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
    }, []);

  const closeConnection: WebSocketContextType["closeConnection"] =
    useCallback(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        console.log("WebSocket connecting");
        return;
      }
      console.log("Closing WebSocket");
      ws?.close();
      wsRef.current = null;
    }, []);

  useEffect(() => {
    return () => {
      // Auto-close on unmount
      closeConnection();
    };
  }, [closeConnection]);

  return (
    <WebSocketContext.Provider
      value={{
        createConnection,
        closeConnection,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};
