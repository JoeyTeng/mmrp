import axios from "axios";
import { getSessionId } from "./sessionService";

// Add more default headers here if needed
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: DEFAULT_HEADERS,
  timeout: 300000, // 5 minutes timeout to handle longer pipeline processing times
});

// Interceptor to handle requests and add session ID if available
apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers["session_id"] = sessionId;
  }
  return config;
});

// Interceptor to handle responses and error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error); // console log the error for debugging
    return Promise.reject(error);
  },
);
