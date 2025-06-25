import { apiClient } from "@/services/apiClient";

// Add more default headers here if needed
const defaultHeaders = {
  "Content-Type": "application/json",
};

function getHeaders(headers?: Record<string, string>) {
  return { ...defaultHeaders, ...headers };
}

export class RequestHandler {
  //get
  static async get<T>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await apiClient.get<T>(path, {
        headers: getHeaders(headers),
      });
      return response.data;
    } catch (error) {
      console.error("GET request error:", error);
      throw error;
    }
  }

  //post
  static async post<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await apiClient.post<T>(path, data, {
        headers: getHeaders(headers),
      });
      return response.data;
    } catch (error) {
      console.error("POST request error:", error);
      throw error;
    }
  }

  //put
  static async put<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await apiClient.put<T>(path, data, {
        headers: getHeaders(headers),
      });
      return response.data;
    } catch (error) {
      console.error("PUT request error:", error);
      throw error;
    }
  }

  // patch

  static async patch<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await apiClient.patch<T>(path, data, {
        headers: getHeaders(headers),
      });
      return response.data;
    } catch (error) {
      console.error(`PATCH request error: ${path}`, error);
      throw error;
    }
  }

  // delete

  static async delete<T>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await apiClient.delete<T>(path, {
        headers: getHeaders(headers),
      });
      return response.data;
    } catch (error) {
      console.error("DELETE request error:", error);
      throw error;
    }
  }
}
