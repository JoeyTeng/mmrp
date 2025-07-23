"use client";

import { useState, useContext, useMemo } from "react";
import { Box, TextField, MenuItem } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { NodeParamValue, ParameterConfigurationProps } from "../types";
import { ModulesContext } from "@/contexts/ModulesContext";
import { ParameterConstraints } from "@/types/module";

export default function ParameterConfiguration({
  node,
  onParamChange,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modules = useContext(ModulesContext);

  const MIN_VALUE = 0;
  const MAX_VALUE = 100;

  const constraintsLookup = useMemo(() => {
    const foundModule = modules.find((item) => item.name === node?.data.label);
    return (
      foundModule?.data.parameters.reduce((acc, { name, metadata }) => {
        acc.set(name, metadata.constraints);
        return acc;
      }, new Map<string, ParameterConstraints>()) ?? new Map()
    );
  }, [modules, node?.data.label]);

  const getInputType = (key: string) => {
    const constraints = constraintsLookup.get(key);
    return constraints.type;
  };

  const handleInputNumber = (key: string, rawValue: string) => {
    const newValue = Number(rawValue);
    const constraints = constraintsLookup.get(key);

    let min = MIN_VALUE;
    let max = MAX_VALUE;

    if (constraints.min !== undefined && constraints.max !== undefined) {
      min = constraints.min;
      max = constraints.max;
    }

    setErrors((prev) => ({
      ...prev,
      [key]:
        newValue < min
          ? `Must be ≥ ${min}`
          : newValue > max
            ? `Must be ≤ ${max}`
            : "",
    }));

    const clampedValue = Math.max(min, Math.min(max, newValue));
    onParamChange(key, clampedValue);
  };

  const renderParamInput = (key: string, value: NodeParamValue) => {
    const inputType = getInputType(key);

    switch (inputType) {
      case "select":
        return (
          <TextField
            key={key}
            select
            fullWidth
            size="small"
            label={key}
            value={value}
            onChange={(e) => onParamChange(key, e.target.value)}
            sx={{ mb: 2 }}
          >
            {constraintsLookup.get(key).options.map((option: string) => (
              <MenuItem key={`${key}-${option}`} value={String(option)}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );

      case "int":
        return (
          <Box
            key={key}
            className={`relative mb-6 mt-2 ${errors[key] ? "text-red-600 !mb-8" : "text-gray-700"}`}
          >
            <NumberField.Root
              inputMode="numeric"
              key={key}
              id={key}
              value={Number(value)}
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
            {errors[key] && (
              <Box className="absolute -bottom-5 left-0 text-xs text-red-600">
                {errors[key]}
              </Box>
            )}
          </Box>
        );

      case "boolean":
        return (
          <TextField
            key={key}
            select
            fullWidth
            label={key}
            size="small"
            value={String(value)}
            onChange={(e) => onParamChange(key, e.target.value === "true")}
            sx={{ mb: 2 }}
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </TextField>
        );

      default:
        return (
          <TextField
            key={key}
            fullWidth
            label={key}
            size="small"
            value={String(value)}
            onChange={(e) => onParamChange(key, e.target.value)}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      {Object.entries(node.data.params).map(([key, value]) =>
        renderParamInput(key, value),
      )}
    </Box>
  );
}
