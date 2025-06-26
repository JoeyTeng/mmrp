import { apiClient } from "@/services/apiClient";

export class RequestHandler {
  //get
  static async get<T>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await apiClient.get<T>(path, {
      headers: headers,
    });
    return response.data;
  }

  //post
  static async post<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await apiClient.post<T>(path, data, {
      headers: headers,
    });
    return response.data;
  }

  //put
  static async put<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await apiClient.put<T>(path, data, {
      headers: headers,
    });
    return response.data;
  }

  // patch

  static async patch<T>(
    path: string,
    data: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await apiClient.patch<T>(path, data, {
      headers: headers,
    });
    return response.data;
  }

  // delete

  static async delete<T>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await apiClient.delete<T>(path, {
      headers: headers,
    });
    return response.data;
  }
}
