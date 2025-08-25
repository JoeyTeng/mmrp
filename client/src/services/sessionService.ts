import { toast } from "react-toastify/unstyled";
import { apiClient } from "./apiClient";

const SESSION_ID =
  process.env.NEXT_PUBLIC_USER_SESSION_ID || "viper_session_id";

export async function initSession(): Promise<string | null> {
  try {
    // Check if we already have a session ID
    const existingSessionId = getSessionId();
    if (existingSessionId) {
      const response = await apiClient.get("/session/verify-session", {
        headers: { session_id: existingSessionId },
      });
      if (response.data.valid_session) {
        console.log("Existing session is valid:");
        return existingSessionId;
      } else {
        toast.info("Existing session is expired, creating new one...");
        clearSession();
      }
    }

    // Create new session
    console.log("Creating new session...");
    const response = await apiClient.post("/session");
    const sessionId = response.data.session_id;
    if (!sessionId) throw new Error("Session ID not returned from server");

    // Store in localStorage
    setSessionId(sessionId);
    toast.success("Session initialized");
    return sessionId;
  } catch (err) {
    throw err;
  }
}

export function getSessionId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SESSION_ID);
  }
  return null;
}

export function setSessionId(sessionId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_ID, sessionId);
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_ID);
    delete apiClient.defaults.headers.common["session_id"];
  }
}
