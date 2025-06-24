"use client";

import { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";
import {
  ParamValueType,
  moduleRegistry,
} from "@/components/modules/modulesRegistry";
import { InfoOutline as InfoIcon } from "@mui/icons-material";
import { Box } from "@mui/material";

type ParameterConfigurationProps = {
  node?: Node<{ label: string; params: Record<string, ParamValueType> }> | null;
  onChange: (params: Record<string, ParamValueType>) => void;
};

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
  onChange: (key: string, value: ParamValueType) => void,
) {
  return (
    <div key={key} className="mb-4">
      <label htmlFor={key} className="block mb-1 font-medium">
        {key}
      </label>
      <input
        id={key}
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(key, Number(e.target.value))}
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
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full p-1.5 rounded bg-gray-100"
      />
    </div>
  );
}

export default function ParameterConfiguration({
  node,
  onChange,
}: ParameterConfigurationProps) {
  const [tempParams, setTempParams] = useState<Record<string, ParamValueType>>(
    {},
  );

  useEffect(() => {
    if (node) {
      setTempParams({ ...node.data.params });
    }
  }, [node]);

  const handleParamChange = (key: string, value: ParamValueType) => {
    const newParams = { ...tempParams, [key]: value };
    setTempParams(newParams);
    onChange(newParams);
  };

  if (!node) {
    return (
      <Box className="flex justify-evenly gap-2.5">
        <InfoIcon className="text-gray-500" />
        <span>select pipeline module to edit parameters</span>
      </Box>
    );
  }

  const { label } = node.data;

  return (
    <Box className="flex-1 overflow-y-auto h-full">
      <div className="p-2">
        {Object.entries(tempParams).map(([key, value]) => {
          const moduleRegistryVal = moduleRegistry[label].params[key];
          // 1) string[]
          if (Array.isArray(moduleRegistryVal)) {
            return renderSelectInput(
              moduleRegistryVal,
              key,
              value,
              handleParamChange,
            );
          }

          // 2) number
          if (typeof value === "number") {
            return renderNumberInput(key, value, handleParamChange);
          }

          // 3) string
          return renderTextInput(key, value, handleParamChange);
        })}
      </div>
    </Box>
  );
}
