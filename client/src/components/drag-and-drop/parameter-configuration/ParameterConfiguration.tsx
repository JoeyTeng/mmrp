"use client";

import { useState, useMemo } from "react";
import { Box, TextField, MenuItem, useTheme } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { ModuleParameter, ParameterConfigurationProps } from "../types";
import Fuse from "fuse.js";
import { ParameterTooltip } from "./ParameterTooltip";

export default function ParameterConfiguration({
  node,
  onParamChange,
  searchQuery,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const theme = useTheme();

  const INPUT_SPACING = "mb-8";

  const { data } = node;
  const { parameters } = data;

  const paramNames = useMemo(
    () => parameters.map((param) => param.name),
    [parameters],
  );

  const fuse = useMemo(() => {
    return new Fuse(paramNames);
  }, [paramNames]);

  const filteredParams = useMemo(() => {
    if (!searchQuery.trim()) return parameters;

    const foundNames = fuse.search(searchQuery).map((result) => result.item);
    return parameters.filter((param) => foundNames.includes(param.name));
  }, [fuse, parameters, searchQuery]);

  const handleInputNumber = (parameter: ModuleParameter, rawValue: string) => {
    const { metadata, name } = parameter;
    const { constraints } = metadata;

    const min = !isNaN(Number(constraints.min)) ? Number(constraints.min) : 0;
    const max = !isNaN(Number(constraints.max))
      ? Number(constraints.max)
      : Infinity;
    let newValue = Number(rawValue);

    setErrors((prev) => ({
      ...prev,
      [name]:
        newValue < min
          ? `Must be ≥ ${min}`
          : newValue > max
            ? `Must be ≤ ${max}`
            : "",
    }));
    newValue = Math.max(min, Math.min(max, newValue));
    onParamChange(name, newValue);
  };

  const renderParamInput = (parameter: ModuleParameter) => {
    const { metadata, name } = parameter;
    const { constraints, value } = metadata;
    const constraintType = constraints.type;

    switch (constraintType) {
      case "select":
        return (
          <Box key={name} className={INPUT_SPACING}>
            <ParameterTooltip description={constraints.description}>
              <TextField
                select
                fullWidth
                size="small"
                label={name}
                value={value}
                onChange={(e) => onParamChange(parameter.name, e.target.value)}
              >
                {constraints.options &&
                  constraints.options.map((option: string) => (
                    <MenuItem key={`${name}-${option}`} value={String(option)}>
                      {option}
                    </MenuItem>
                  ))}
              </TextField>
            </ParameterTooltip>
          </Box>
        );

      case "int":
        return (
          <Box
            key={name}
            className={`relative ${errors[name] ? "text-red-600 !mb-6" : "text-gray-700"}`}
          >
            <Box className={INPUT_SPACING}>
              <NumberField.Root
                inputMode="numeric"
                key={name}
                id={`inputNumber-${name}`}
                value={Number(value)}
                className="flex-1"
              >
                <NumberField.ScrubArea className="absolute -top-3.5 left-2 z-10 bg-white px-1">
                  <label
                    htmlFor={name}
                    className={`text-xs font-medium transition-colors ${errors[name] ? "text-red-600" : "text-gray-500"}`}
                  >
                    {name}
                  </label>
                </NumberField.ScrubArea>

                <NumberField.Group className="relative">
                  <ParameterTooltip description={constraints.description}>
                    <NumberField.Input
                      onChange={(e) =>
                        handleInputNumber(parameter, e.target.value)
                      }
                      className={`
                        w-full p-2 h-10 border-1 border-b rounded-sm text-sm
                        ${errors[name] ? "!border-red-600 !ring-red-600" : "border-gray-300"}
                        focus:outline-none focus:ring-1 focus:ring-blue-500
                      `}
                      aria-label={constraints.description ?? undefined}
                      style={{ ...theme.typography.body1 }}
                    />
                  </ParameterTooltip>
                </NumberField.Group>
              </NumberField.Root>
            </Box>

            {errors[name] && (
              <Box className="absolute -bottom-5 left-0 text-xs text-red-600">
                {errors[name]}
              </Box>
            )}
          </Box>
        );

      case "bool":
        return (
          <Box key={name} className={INPUT_SPACING}>
            <ParameterTooltip description={constraints.description}>
              <TextField
                select
                fullWidth
                label={name}
                size="small"
                value={String(value)}
                onChange={(e) => onParamChange(parameter.name, e.target.value)}
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </TextField>
            </ParameterTooltip>
          </Box>
        );

      default:
        return (
          <Box key={name} className={INPUT_SPACING}>
            <ParameterTooltip description={constraints.description}>
              <TextField
                fullWidth
                label={name}
                size="small"
                value={String(value)}
                onChange={(e) => onParamChange(parameter.name, e.target.value)}
              />
            </ParameterTooltip>
          </Box>
        );
    }
  };

  return (
    <Box className="p-4 h-full overflow-y-auto">
      {filteredParams.map((param) => renderParamInput(param))}
    </Box>
  );
}
