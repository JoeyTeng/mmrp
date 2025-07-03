"use client";

import type { Node } from "@xyflow/react";
import { InfoOutline as InfoIcon } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useContext } from "react";
import { ModulesContext } from "@/contexts/ModulesContext";
import { NodeData, ParameterDefinition, ParamValueType } from "./types";

type ParameterConfigurationProps = {
  node?: Node<NodeData> | null;
  onParamChange: (key: string, value: ParamValueType) => void;
};

function renderBoolInput(
  key: string,
  value: ParamValueType,
  onChange: (key: string, value: ParamValueType) => void,
) {
  return (
    <div key={key} className="mb-4">
      <label className="block mb-1 font-medium">{key}</label>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(key, e.target.checked)}
      />
    </div>
  );
}

function renderSelectInput(
  moduleRegistryVal: string[],
  key: string,
  value: ParamValueType,
  onChange: (key: string, value: ParamValueType) => void,
) {
  const options = moduleRegistryVal;
  const selected = typeof value === "string" ? value : "";

  return (
    <div key={key} className="mb-4">
      <label htmlFor={key} className="block mb-1 font-medium">
        {key}
      </label>
      <select
        id={key}
        value={selected}
        className="w-full p-1.5 rounded bg-gray-100"
        onChange={(e) => onChange(key, e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function renderNumberInput(
  key: string,
  value: ParamValueType,
  paramDef: ParameterDefinition,
  onChange: (key: string, value: ParamValueType) => void,
) {
  const [min, max] = Array.isArray(paramDef.validValues)
    ? (paramDef.validValues as [number, number])
    : [undefined, undefined];

  return (
    <div key={key} className="mb-4">
      <label htmlFor={key} className="block mb-1 font-medium">
        {key}
      </label>
      <input
        id={key}
        type="number"
        min={min}
        max={max}
        value={typeof value === "number" ? value : ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          let num = Number(e.target.value);
          if (min !== undefined && num < min) num = min;
          if (max !== undefined && num > max) num = max; // guard against invalid input
          onChange(key, num);
        }}
        className="w-full p-1.5 rounded bg-gray-100"
      />
    </div>
  );
}

function renderTextInput(
  key: string,
  value: ParamValueType,
  onChange: (key: string, value: ParamValueType) => void,
) {
  return (
    <div key={key} className="mb-4">
      <label htmlFor={key} className="block mb-1 font-medium">
        {key}
      </label>
      <input
        id={key}
        type="text"
        value={typeof value === "string" ? value : String(value)}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full p-1.5 rounded bg-gray-100"
      />
    </div>
  );
}

export default function ParameterConfiguration({
  node,
  onParamChange,
}: ParameterConfigurationProps) {
  const modules = useContext(ModulesContext);

  if (!node) {
    return (
      <Box className="flex justify-evenly gap-2.5">
        <InfoIcon className="text-gray-500" />
        <span>select pipeline module to edit parameters</span>
      </Box>
    );
  }

  if (!modules) return;
  const { label, params } = node.data;

  const moduleDef = modules.find((m) => m.name == label)!;
  if (!moduleDef) return;

  return (
    <Box className="flex-1 overflow-y-auto h-full">
      <div className="p-2">
        {Object.entries(params).map(([key, value]) => {
          const paramDef = moduleDef.parameters.find((p) => p.name === key);
          if (!paramDef) return;

          if (paramDef.type === "bool") {
            return renderBoolInput(key, Boolean(value), onParamChange);
          }

          // 2) select
          if (
            Array.isArray(paramDef.validValues) &&
            paramDef.validValues.length > 0 &&
            typeof paramDef.validValues[0] === "string"
          ) {
            return renderSelectInput(
              paramDef.validValues as string[],
              key,
              value,
              onParamChange,
            );
          }

          // 3) number
          if (paramDef.type === "int" || paramDef.type === "float") {
            return renderNumberInput(
              key,
              Number(value),
              paramDef,
              onParamChange,
            );
          }

          // 4) fallback text
          return renderTextInput(key, String(value), onParamChange);
        })}
      </div>
    </Box>
  );
}
