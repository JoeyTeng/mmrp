"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { InfoOutline as InfoIcon } from "@mui/icons-material";
import { Box, TextField, MenuItem } from "@mui/material";
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
  const [numberInputStates, setNumberInputStates] = useState<
    Record<string, string>
  >({});

  useImperativeHandle(
    ref,
    () => ({
      getTempNode: () => tempNode ?? null,
    }),
    [tempNode],
  );

  useState(() => {
    if (tempNode) {
      const initialStates: Record<string, string> = {};
      Object.entries(tempNode.data.params).forEach(([key, value]) => {
        if (typeof value === "number") {
          initialStates[key] = value.toString();
        }
      });
      setNumberInputStates(initialStates);
    }
  });

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
    const regex = /^\d*\.?\d*$/;
    if (regex.test(rawValue) || rawValue === "") {
      setNumberInputStates((prev) => ({ ...prev, [key]: rawValue }));
      handleParamChange(key, rawValue === "" ? 0 : Number(rawValue));
    }
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
          <TextField
            key={key}
            fullWidth
            type="text" // Changed from "number" to "text" for better control
            label={key}
            value={numberInputStates[key] || ""}
            onChange={(e) => handleInputNumber(key, e.target.value)}
            sx={{ mb: 2 }}
          />
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
