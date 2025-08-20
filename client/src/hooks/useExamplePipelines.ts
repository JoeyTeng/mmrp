"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import { camelizeKeys } from "@/utils/camelize";
import { ExamplePipeline } from "@/types/pipeline";

export function useExamplePipelines() {
  const [pipelines, setPipelines] = useState<ExamplePipeline[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPipelines = () => {
    setLoading(true);
    apiClient
      .get("/pipeline/examples") // TODO: Validate response schema
      .then((res) => setPipelines(camelizeKeys(res.data) as ExamplePipeline[]))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  return { pipelines, loading };
}
