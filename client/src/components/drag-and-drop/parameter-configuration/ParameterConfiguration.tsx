"use client";

import { useState, useMemo } from "react";
import { Box, TextField, MenuItem, useTheme } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { ParameterConfigurationProps } from "../types";
import Fuse from "fuse.js";
import { ParameterTooltip } from "./ParameterTooltip";
import { ModuleParameter, ParameterConstraint } from "@/types/module";

export default function ParameterConfiguration({
  node,
  onParamChange,
  searchQuery,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const theme = useTheme();

  const INPUT_SPACING = "mb-8";

  const { parameters } = node.data;

  const fuse = useMemo(() => {
    const paramNames = parameters.map((param) => param.name);
    return new Fuse(paramNames);
  }, [parameters]);

  const filteredParams = useMemo(() => {
    if (!searchQuery) return parameters;

    const foundNames = fuse.search(searchQuery).map((result) => result.item);
    return parameters.filter((param) => foundNames.includes(param.name));
  }, [fuse, parameters, searchQuery]);

  const getMinMax = (constraints: ParameterConstraint) => {
    const min = !isNaN(Number(constraints.min))
      ? Number(constraints.min)
      : -Infinity;
    const max = !isNaN(Number(constraints.max))
      ? Number(constraints.max)
      : Infinity;
    return { min, max };
  };

  const updateError = (
    name: string,
    value: number,
    min: number,
    max: number,
  ) => {
    const errorMsg =
      value < min ? `Must be ≥ ${min}` : value > max ? `Must be ≤ ${max}` : "";
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleInputNumber = (parameter: ModuleParameter, rawValue: string) => {
    const { metadata, name } = parameter;
    const { constraints } = metadata;

    const { min, max } = getMinMax(constraints);
    const newValue = Number(rawValue);

    updateError(name, newValue, min, max);
  };

  const onValueChange = (
    parameter: ModuleParameter,
    newValue: number | null,
  ) => {
    const { metadata, name } = parameter;
    const { constraints } = metadata;
    const { min, max } = getMinMax(constraints);

    const isBlank = newValue === null || newValue === undefined;

    if (isBlank) {
      if (!constraints.required) {
        // Optional and blank — allow empty
        setErrors((prev) => ({ ...prev, [name]: "" }));
        onParamChange(name, null);
        return;
      } else {
        // Required and blank — fallback to default or 0
        const fallback =
          constraints.default !== undefined ? Number(constraints.default) : 0;
        const clampedValue = Math.max(min, Math.min(max, fallback));

        setErrors((prev) => ({ ...prev, [name]: "" }));
        onParamChange(name, clampedValue);
        return;
      }
    }
    const parsedValue = Number(newValue);
    updateError(name, parsedValue, min, max);

    const clampedValue = Math.max(min, Math.min(max, parsedValue));
    onParamChange(name, clampedValue);
    setErrors((prev) => ({ ...prev, [name]: "" }));
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
                value={value ?? ""}
                onChange={(e) =>
                  onParamChange(parameter.name, e.target.value || null)
                }
              >
                {/* Optional blank entry */}
                {!constraints.required && <MenuItem value="">—</MenuItem>}
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
                key={name}
                id={`inputNumber-${name}`}
                value={
                  value === "" || value === null || value === undefined
                    ? null
                    : Number(value)
                }
                onValueChange={(newValue) => {
                  onValueChange(parameter, newValue);
                }}
                format={{}}
                inputMode="numeric"
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
                      placeholder={
                        !constraints.required ? "Optional" : undefined
                      }
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
                value={String(value ?? "")}
                onChange={(e) =>
                  onParamChange(
                    parameter.name,
                    e.target.value === "" ? null : e.target.value,
                  )
                }
              >
                {/* Optional blank */}
                {!constraints.required && <MenuItem value="">—</MenuItem>}
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
