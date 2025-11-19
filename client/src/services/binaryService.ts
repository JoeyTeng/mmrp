// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import { validateConfigFile } from "@/utils/configValidator";
import { apiClient } from "./apiClient";

export async function uploadBinaryToBackend(files: FormData): Promise<boolean> {
  const validJson = await validateConfigFile(files.get("config") as File);
  if (!validJson) {
    return false;
  }
  const response = await apiClient.post<boolean>("/modules/upload", files, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
