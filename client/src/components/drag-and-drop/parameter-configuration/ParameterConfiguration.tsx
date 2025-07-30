"use client";

import { useState, useContext, useMemo, useCallback } from "react";
import { Box, TextField, MenuItem, useTheme } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import {
  ModuleParamLookupType,
  NodeParamValue,
  ParameterConfigurationProps,
} from "../types";
import { ModulesContext } from "@/contexts/ModulesContext";
import Fuse from "fuse.js";
import { ParameterTooltip } from "./ParameterTooltip";

export default function ParameterConfiguration({
  node,
  onParamChange,
  searchQuery,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modules = useContext(ModulesContext);
  const theme = useTheme();

  const MIN_VALUE = 0;
  const MAX_VALUE = 100;
  const INPUT_SPACING = "mb-8";

  const paramLookup = useMemo(() => {
    const foundModule = modules.find((item) => item.name === node?.data.label);
    return (
      foundModule?.parameters.reduce((acc, param) => {
        acc[param.name] = param;
        return acc;
      }, {} as ModuleParamLookupType) ?? {}
    );
  }, [modules, node?.data.label]);

  // node.data.params = {
  //   ...node.data.params,
  //   string_param: "hello world",
  //   number_param: 42,
  //   boolean_param: true,
  //   select_param: "option1",
  // };

  // paramLookup.string_param = {
  //   name: "string_param",
  //   // constraints: [],
  //   description: "This is a string input test.",
  //   type: "str",
  //   required: false,
  // };

  // paramLookup.number_param = {
  //   name: "number_param",
  //   constraints: [0, 100],
  //   description: "This is a number input test.",
  // };

  // paramLookup.boolean_param = {
  //   name: "boolean_param",
  //   constraints: [],
  //   description: "This is a boolean input test.",
  // };

  // paramLookup.select_param = {
  //   name: "select_param",
  //   constraints: ["option1", "option2", "option3"],
  //   description: "This is a select input test.",
  // };

  const paramKeys = Object.keys(node.data.params);

  const fuse = useMemo(() => {
    return new Fuse(paramKeys, {
      includeScore: true,
      threshold: 0.5,
    });
  }, [paramKeys]);

  const filteredParams = useMemo(() => {
    if (!searchQuery) return paramKeys;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, paramKeys, searchQuery]);

  const getInputType = (key: string, value: NodeParamValue) => {
    if (
      typeof value === "string" &&
      Array.isArray(paramLookup[key]?.constraints)
    )
      return "select";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return "text";
  };

  const handleInputNumber = (key: string, rawValue: string) => {
    const newValue = Number(rawValue);

    let min = MIN_VALUE;
    let max = MAX_VALUE;

    if (paramLookup[key]?.constraints?.length === 2) {
      min = Number(paramLookup[key].constraints[0]);
      max = Number(paramLookup[key].constraints[1]);
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
    const { constraints = [], description = "" } = paramLookup[key] ?? {};
    const inputType = getInputType(key, value);

    switch (inputType) {
      case "select":
        return (
          <Box key={key} className={INPUT_SPACING}>
            <ParameterTooltip description={description}>
              <TextField
                select
                fullWidth
                size="small"
                label={formatLabel(key)}
                value={value}
                onChange={(e) => onParamChange(key, e.target.value)}
              >
                {Array.isArray(constraints) &&
                  constraints.map((option) => (
                    <MenuItem key={`${key}-${option}`} value={String(option)}>
                      {option}
                    </MenuItem>
                  ))}
              </TextField>
            </ParameterTooltip>
          </Box>
        );

      case "number":
        return (
          <Box
            key={key}
            className={`relative ${errors[key] ? "text-red-600 !mb-6" : "text-gray-700"}`}
          >
            <Box className={INPUT_SPACING}>
              <NumberField.Root
                inputMode="numeric"
                key={key}
                id={key}
                value={Number(value)}
                min={Number(constraints?.[0] ?? MIN_VALUE)}
                max={Number(constraints?.[1]) ?? MAX_VALUE}
                className="flex-1"
              >
                <NumberField.ScrubArea className="absolute -top-3.5 left-2 z-10 bg-white px-1">
                  <label
                    htmlFor={key}
                    className={`text-xs font-medium transition-colors ${errors[key] ? "text-red-600" : "text-gray-500"}`}
                  >
                    {formatLabel(key)}
                  </label>
                </NumberField.ScrubArea>

                <NumberField.Group className="relative">
                  <ParameterTooltip description={description}>
                    <NumberField.Input
                      onChange={(e) => handleInputNumber(key, e.target.value)}
                      className={`
                    w-full p-2 h-10 border-1 border-b rounded-sm text-sm
                    ${errors[key] ? "!border-red-600 !ring-red-600" : "border-gray-300"}
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                  `}
                      aria-label={description ?? undefined}
                      style={{ ...theme.typography.body1 }}
                    />
                  </ParameterTooltip>
                </NumberField.Group>
              </NumberField.Root>
            </Box>

            {errors[key] && (
              <Box className="absolute -bottom-5 left-0 text-xs text-red-600">
                {errors[key]}
              </Box>
            )}
          </Box>
        );

      case "boolean":
        return (
          <Box key={key} className={INPUT_SPACING}>
            <ParameterTooltip description={description}>
              <TextField
                select
                fullWidth
                label={formatLabel(key)}
                size="small"
                value={String(value)}
                onChange={(e) => onParamChange(key, e.target.value === "true")}
                className="flex-1"
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </TextField>
            </ParameterTooltip>
          </Box>
        );

      default:
        return (
          <Box key={key} className={INPUT_SPACING}>
            <ParameterTooltip description={description}>
              <TextField
                fullWidth
                label={formatLabel(key)}
                size="small"
                value={String(value)}
                onChange={(e) => onParamChange(key, e.target.value)}
                className="flex-1"
              />
            </ParameterTooltip>
          </Box>
        );
    }
  };

  const formatLabel = useCallback((label: string) => {
    return label
      .split("_")
      .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  return (
    <Box className="p-4 h-full overflow-y-auto">
      {filteredParams.map((key) =>
        renderParamInput(key, node.data.params[key]),
      )}
    </Box>
  );
}
