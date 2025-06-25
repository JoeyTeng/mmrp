import axios from "axios";
import { config } from "@/utils/config";

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Interceptor to handle responses and error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error); // console log the error for debugginh
    return Promise.reject(error);
  },
);
