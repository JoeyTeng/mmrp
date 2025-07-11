import {
  FormatDefinition,
  NodeType,
  ParameterDefinition,
} from "@/components/drag-and-drop/types";

export interface ModuleMeta {
  id: number;
  name: string;
  role: NodeType;
  parameters: ParameterDefinition[];
  inputFormats: FormatDefinition[];
  outputFormats: FormatDefinition[];
}
