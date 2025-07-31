"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import { camelizeKeys } from "@/utils/camelize";
import { ModuleMeta } from "@/types/module";

export function useModules() {
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModules = () => {
    setLoading(true);
    apiClient
      .get<ModuleMeta[]>("/module/") // TODO: Validate response schema
      .then((res) => setModules(camelizeKeys(res.data) as ModuleMeta[]))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadModules();
  }, []);

  return { modules, loading, reloadModules: loadModules };
}
