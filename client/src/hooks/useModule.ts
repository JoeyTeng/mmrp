"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import {
  FormatDefinition,
  ParameterDefinition,
} from "@/components/modules/modulesRegistry";
import { camelizeKeys } from "@/utils/case";
import { NodeType } from "@/components/drag-and-drop/types";

export interface ModuleMeta {
  id: number;
  name: string;
  role: NodeType;
  parameters: ParameterDefinition[];
  inputFormats: FormatDefinition[];
  outputFormats: FormatDefinition[];
}

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
