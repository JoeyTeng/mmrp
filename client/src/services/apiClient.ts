import axios from "axios";

// Add more default headers here if needed
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: DEFAULT_HEADERS,
  timeout: 600000, // 10 minutes timeout to handle longer pipeline processing times
});

// Interceptor to handle responses and error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error); // console log the error for debugging
    return Promise.reject(error);
  },
);
