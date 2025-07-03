"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import { camelizeKeys } from "@/utils/camelize";
import { ModuleMeta } from "@/types/module";

export function useModules() {
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<ModuleMeta[]>("/module/")
      .then((res) => setModules(camelizeKeys(res.data) as ModuleMeta[]))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { modules, loading };
}
