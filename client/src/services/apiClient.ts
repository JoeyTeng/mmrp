import axios from "axios";

// Add more default headers here if needed
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
