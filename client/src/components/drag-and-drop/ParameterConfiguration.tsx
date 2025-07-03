"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { InfoOutline as InfoIcon } from "@mui/icons-material";
import { Box, TextField, MenuItem } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { NodeParamValue } from "../modules/modulesRegistry";
import {
  ParameterConfigurationProps,
  ParameterConfigurationRef,
} from "./types";

const getInputType = (value: NodeParamValue) => {
  if (Array.isArray(value)) return "select";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "text";
};

const ParameterConfiguration = forwardRef<
  ParameterConfigurationRef,
  ParameterConfigurationProps
>(({ node }, ref) => {
  const [tempNode, setTempNode] = useState(node);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getTempNode: () => tempNode ?? null,
    }),
    [tempNode],
  );

  const handleParamChange = useCallback(
    (key: string, value: NodeParamValue) => {
      setTempNode((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          data: {
            ...prev.data,
            params: {
              ...prev.data.params,
              [key]: value,
            },
          },
        };
      });
    },
    [],
  );

  const handleInputNumber = (key: string, rawValue: string) => {
    const newValue = Number(rawValue);
    const min = -1;
    const max = 100;

    if (newValue <= min) {
      setError(`Must be greater than ${min}`);
    } else if (newValue > max) {
      setError(`Must be less than ${max}`);
    } else {
      setError(null);
    }
    handleParamChange(key, newValue);
  };

  if (!tempNode) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={2}>
        <InfoIcon color="action" />
        <span>Select pipeline module to edit parameters</span>
      </Box>
    );
  }

  const renderParamInput = (key: string, value: NodeParamValue) => {
    const inputType = getInputType(value);

    switch (inputType) {
      case "select":
        return (
          <TextField
            key={key}
            select
            fullWidth
            label={key}
            value={value}
            onChange={(e) => handleParamChange(key, e.target.value)}
            sx={{ mb: 2 }}
          >
            {Array.isArray(value) &&
              value.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
          </TextField>
        );

      case "number":
        return (
          <Box
            className={`relative mb-6 mt-2 ${error ? "text-red-600" : "text-gray-700"}`}
          >
            <NumberField.Root id={key} value={Number(value)} min={10} max={100}>
              <NumberField.ScrubArea className="absolute -top-3.5 left-2 z-10 bg-white px-1">
                <label
                  htmlFor={key}
                  className={`text-xs font-medium transition-colors ${error ? "text-red-600" : "text-gray-500"}`}
                >
                  {key}
                </label>
              </NumberField.ScrubArea>

              <NumberField.Group className="relative">
                <NumberField.Input
                  onChange={(e) => handleInputNumber(key, e.target.value)}
                  className={`
                    w-full p-4 border-1 border-b rounded-sm
                    ${error ? "!border-red-600" : "border-gray-300"} 
                  `}
                />
              </NumberField.Group>
            </NumberField.Root>
            {error && (
              <Box className="absolute -bottom-5 left-0 text-xs text-red-600 mt-1">
                {error}
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
            value={String(value)}
            onChange={(e) => handleParamChange(key, e.target.value === "true")}
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
            value={String(value)}
            onChange={(e) => handleParamChange(key, e.target.value)}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      {Object.entries(tempNode.data.params).map(([key, value]) =>
        renderParamInput(key, value),
      )}
    </Box>
  );
});

ParameterConfiguration.displayName = "ParameterConfiguration";
export default ParameterConfiguration;
