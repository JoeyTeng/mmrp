"use client";

import { useState, useContext, useMemo } from "react";
import { Box, TextField, MenuItem, Tooltip, IconButton } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import {
  ModuleParamLookupType,
  NodeParamValue,
  ParameterConfigurationProps,
} from "../types";
import { ModulesContext } from "@/contexts/ModulesContext";
import { InfoOutlined } from "@mui/icons-material";

export default function ParameterConfiguration({
  node,
  onParamChange,
}: ParameterConfigurationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modules = useContext(ModulesContext);

  const MIN_VALUE = 0;
  const MAX_VALUE = 100;

  const paramLookup = useMemo(() => {
    const foundModule = modules.find((item) => item.name === node?.data.label);
    return (
      foundModule?.parameters.reduce((acc, param) => {
        acc[param.name] = param;
        return acc;
      }, {} as ModuleParamLookupType) ?? {}
    );
  }, [modules, node?.data.label]);

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

    const infoNode = (
      <>
        {description && (
          <Tooltip title={description} placement="top">
            <IconButton
              size="small"
              edge="end"
              sx={{
                p: 0, // no extra padding
                ml: 1, // small gap from the input
                "& .MuiSvgIcon-root": {
                  fontSize: "1em", // shrink the SVG down to text‑size
                },
              }}
            >
              <InfoOutlined fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );

    switch (inputType) {
      case "select":
        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              gap: 0.5,
              mb: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label={key}
              value={value}
              onChange={(e) => onParamChange(key, e.target.value)}
              sx={{ flex: 1 }}
            >
              {Array.isArray(constraints) &&
                constraints.map((option) => (
                  <MenuItem key={`${key}-${option}`} value={String(option)}>
                    {option}
                  </MenuItem>
                ))}
            </TextField>
            {infoNode}
          </Box>
        );

      case "number":
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
                min={Number(constraints?.[0] ?? MIN_VALUE)}
                max={Number(constraints?.[1]) ?? MAX_VALUE}
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
              {infoNode}
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
          <Box
            key={key}
            sx={{
              display: "flex",
              gap: 0.5,
              mb: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextField
              select
              fullWidth
              label={key}
              size="small"
              value={String(value)}
              onChange={(e) => onParamChange(key, e.target.value === "true")}
              sx={{ flex: 1 }}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </TextField>
            {infoNode}
          </Box>
        );

      default:
        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              gap: 0.5,
              mb: 2,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextField
              fullWidth
              label={key}
              size="small"
              value={String(value)}
              onChange={(e) => onParamChange(key, e.target.value)}
              sx={{ flex: 1 }}
            />
            {infoNode}
          </Box>
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
