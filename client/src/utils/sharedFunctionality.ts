import crypto from "crypto";
import stringify from "json-stable-stringify";
import type { PipelineData, ProtectedExport } from "./types";
import { AxiosError } from "axios";
import axios from "axios";

export function handleError(error: unknown): string {
  let message = "An unexpected error occurred.";
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    message =
      axiosError.response?.data?.detail || axiosError.message || message;
  } else if (error instanceof Error) {
    // Frontend error
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }
  console.error(message);
  return message;
}

export const generateHash = (data: object): string => {
  const stringified = stringify(data) as string;
  return crypto.createHash("sha256").update(stringified).digest("hex");
};

export const createProtectedExport = (data: PipelineData): ProtectedExport => {
  const exportData = {
    metadata: {
      version: "1.0",
      timestamp: new Date().toISOString(),
    },
    data: data,
  };

  const hash = generateHash(exportData);
  return {
    ...exportData,
    _integrity: `sha256-${hash}`,
  };
};

export const verifyImport = (importData: ProtectedExport): PipelineData => {
  try {
    // Type guard to check if it's a ProtectedExport
    const isProtectedExport = (
      data: ProtectedExport,
    ): data is ProtectedExport => {
      return (
        !!data?.metadata &&
        !!data?.data &&
        Array.isArray(data.data.nodes) &&
        Array.isArray(data.data.edges)
      );
    };

    if (!isProtectedExport(importData)) {
      throw new Error("Invalid pipeline format");
    }

    // Verify integrity if hash exists
    if (importData._integrity) {
      const { _integrity, ...dataToVerify } = importData;
      const hash = _integrity.replace("sha256-", "");

      const currentHash = generateHash(dataToVerify);
      if (currentHash !== hash) {
        throw new Error("Data integrity check failed");
      }
    }

    return importData.data;
  } catch (e) {
    throw new Error(
      `Import verification failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
};
