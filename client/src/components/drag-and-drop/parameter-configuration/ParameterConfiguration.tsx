"use client";

import { useState, useContext, useMemo } from "react";
import { Box, TextField, MenuItem } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { NodeParamValue, ParameterConfigurationProps } from "../types";
import { ModulesContext } from "@/contexts/ModulesContext";
import { ParameterConstraints } from "@/types/module";
import ParameterInfoToolTip from "./ParameterInfoToolTip";
import { isFrameworkHandledParameter } from "@/utils/sharedFunctionality";

export default function ParameterConfiguration({
  node,
  onParamChange,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modules = useContext(ModulesContext);

  const constraintsLookup = useMemo(() => {
    const foundModule = modules.find(
      (item) => item.moduleClass === node?.data.moduleClass,
    );

    return (
      foundModule?.data.parameters.reduce((acc, { name, metadata }) => {
        const isRequired = metadata.constraints?.required;
        // Skip if name is "input" or "output" and not required because this is handled by source/result node
        if (isFrameworkHandledParameter(name) && !isRequired) return acc;

        acc.set(name, metadata.constraints);
        return acc;
      }, new Map<string, ParameterConstraints>()) ?? new Map()
    );
  }, [modules, node?.data.name]);

  const handleInputNumber = (key: string, rawValue: string) => {
    const newValue = Number(rawValue);
    const constraints = constraintsLookup.get(key);

    let clampedValue: number = newValue;
    if (constraints.min !== undefined && constraints.max !== undefined) {
      const min = constraints.min;
      const max = constraints.max;

      setErrors((prev) => ({
        ...prev,
        [key]:
          newValue < min
            ? `Must be ≥ ${min}`
            : newValue > max
              ? `Must be ≤ ${max}`
              : "",
      }));

      clampedValue = Math.max(min, Math.min(max, newValue));
    }

    onParamChange(key, clampedValue);
  };

  const renderParamInput = (key: string, value: NodeParamValue) => {
    const constraints = constraintsLookup.get(key);
    // This is mainly to filter out framework-handled parameters like "input", "output"
    if (!constraints) {
      return null;
    }

    switch (constraints.type) {
      case "select":
        return (
          <Box
            key={key}
            className="flex gap-1 mb-4 justify-between items-center"
          >
            <TextField
              select
              fullWidth
              size="small"
              label={key}
              value={value}
              onChange={(e) => onParamChange(key, e.target.value)}
              className="flex-1"
            >
              {constraintsLookup.get(key).options.map((option: string) => (
                <MenuItem key={`${key}-${option}`} value={String(option)}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <ParameterInfoToolTip description={constraints.description} />
          </Box>
        );

      case "int":
        return (
          <Box
            key={key}
            className={`relative ${errors[key] ? "text-red-600 !mb-8" : "text-gray-700"}`}
          >
            <Box className="flex justify-center items-center mb-6 mt-2">
              <NumberField.Root
                inputMode="numeric"
                key={key}
                id={key}
                value={Number(value)}
                className="flex-1"
              >
                <NumberField.ScrubArea className="absolute -top-3.5 left-2 z-10 bg-white px-1">
                  <label
                    htmlFor={key}
                    className={`text-xs font-medium transition-colors ${errors[key] ? "text-red-600" : "text-gray-500"}`}
                  >
                    {key}
                  </label>
                </NumberField.ScrubArea>

                <NumberField.Group className="relative">
                  <NumberField.Input
                    onChange={(e) => handleInputNumber(key, e.target.value)}
                    className={`
                    w-full p-2 h-10 border-1 border-b rounded-sm text-sm
                    ${errors[key] ? "!border-red-600 !ring-red-600" : "border-gray-300"}
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                  `}
                  />
                </NumberField.Group>
              </NumberField.Root>
              <ParameterInfoToolTip description={constraints.description} />
            </Box>

            {errors[key] && (
              <Box className="absolute -bottom-5 left-0 text-xs text-red-600">
                {errors[key]}
              </Box>
            )}
          </Box>
        );

      case "bool":
        return (
          <Box
            key={key}
            className="flex gap-1 mb-4 justify-between items-center"
          >
            <TextField
              select
              fullWidth
              label={key}
              size="small"
              value={String(value)}
              onChange={(e) => onParamChange(key, e.target.value === "true")}
              className="flex-1"
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </TextField>
            <ParameterInfoToolTip description={constraints.description} />
          </Box>
        );

      default:
        return (
          <Box
            key={key}
            className="flex gap-1 mb-4 justify-between items-center"
          >
            <TextField
              fullWidth
              label={key}
              size="small"
              value={String(value)}
              onChange={(e) => onParamChange(key, e.target.value)}
              className="flex-1"
            />
            <ParameterInfoToolTip description={constraints.description} />
          </Box>
        );
    }
  };

  return (
    <Box className="p-4 h-full overflow-y-auto">
      {Object.entries(node.data.params).map(([key, value]) =>
        renderParamInput(key, value),
      )}
    </Box>
  );
}
