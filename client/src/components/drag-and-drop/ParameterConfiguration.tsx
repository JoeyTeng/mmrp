"use client";

import type { Node } from "@xyflow/react";
import {
  ParamValueType,
  moduleRegistry,
} from "@/components/modules/modulesRegistry";
import { Info } from "lucide-react";

type ParameterConfigurationProps = {
  node?: Node<{ label: string; params: Record<string, ParamValueType> }> | null;
  onChange: (key: string, value: ParamValueType) => void;
};

function renderSelectInput(
  moduleRegistryVal: string[],
  key: string,
  value: ParamValueType,
  onChange: (key: string, value: ParamValueType) => void,
) {
  const options = moduleRegistryVal;
  // value should be a single string
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
        onChange={(e) => {
          const selected = Array.from(
            e.currentTarget.selectedOptions,
            (o) => o.value,
          );
          onChange(key, selected[0] ?? "");
        }}
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
        onChange={(e) => onChange(key, Number(e.currentTarget.value))}
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
        onChange={(e) => onChange(key, e.currentTarget.value)}
        className="w-full p-1.5 rounded bg-gray-100"
      />
    </div>
  );
}

export default function ParameterConfiguration({
  node,
  onChange,
}: ParameterConfigurationProps) {
  if (!node) {
    return (
      <div className="flex-1 border border-gray-700 h-full bg-white">
        <div className="bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300">
          Select a node to configure
        </div>
        <div className="flex justify-evenly gap-2.5">
          <Info size={16} className="text-gray-500" />
          <span>select pipeline module to edit parameters</span>
        </div>
      </div>
    );
  }

  const { label, params } = node.data;

  return (
    <div className="flex-1 border border-gray-900 rounded-md overflow-y-auto bg-white h-full">
      <div className="bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300">
        {label} Parameters
      </div>
      <div className="p-2.5">
        {Object.entries(params).map(([key, value]) => {
          const moduleRegistryVal = moduleRegistry[label].params[key];
          // 1) string[]
          if (Array.isArray(moduleRegistryVal)) {
            return renderSelectInput(moduleRegistryVal, key, value, onChange);
          }

          // 2) number
          if (typeof value === "number") {
            return renderNumberInput(key, value, onChange);
          }

          // 3) string
          return renderTextInput(key, value, onChange);
        })}
      </div>
    </div>
  );
}
