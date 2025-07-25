"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import { camelizeKeys } from "@/utils/camelize";
import { Module } from "@/types/module";

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Module[]>("/modules/") // TODO: Validate response schema
      .then((res) => setModules(camelizeKeys(res.data) as Module[]))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { modules, loading };
}
