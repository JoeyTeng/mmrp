// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import type { Node } from "@xyflow/react";
import { ParamValueType, ModuleType, ModuleData } from "@/types/module";

export type NodeParamValue = ParamValueType | string[];

export type FlowCanvasProps = {
  editingNode: Node<ModuleData, ModuleType> | null;
  onEditNode: (node: Node<ModuleData, ModuleType>) => void;
};

export interface ParameterConfigurationDrawerProps {
  editingNode: Node<ModuleData, ModuleType>;
  clearEditingNode: () => void;
}

export type ParameterConfigurationProps = {
  node: Node<ModuleData, ModuleType>;
  onParamChange: (key: string, value: ParamValueType) => void;
  searchQuery: string;
};

export type NodePreset = {
  name: string;
  moduleClass: string;
  parameters: Record<string, ParamValueType>;
};
