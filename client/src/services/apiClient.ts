import axios from "axios";
import { config } from "@/utils/config";

// Add more default headers here if needed
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: DEFAULT_HEADERS,
  timeout: 10000, // 10 seconds timeout
});

// Interceptor to handle responses and error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error); // console log the error for debugging
    return Promise.reject(error);
  },
);
