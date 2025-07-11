"use client";

import {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useContext,
  useMemo,
} from "react";
import { InfoOutline as InfoIcon } from "@mui/icons-material";
import { Box, TextField, MenuItem } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import {
  ConstraintsLookupType,
  NodeData,
  NodeParamValue,
  NodeType,
  ParamValueType,
} from "../types";
import {
  ParameterConfigurationProps,
  ParameterConfigurationRef,
} from "../types";
import type { Node } from "@xyflow/react";
import { ModulesContext } from "@/contexts/ModulesContext";

function ParameterConfiguration(
  { node }: ParameterConfigurationProps,
  ref: React.Ref<ParameterConfigurationRef>,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempNode, setTempNode] = useState<Node<NodeData, NodeType> | null>(
    node ?? null,
  );
  const modules = useContext(ModulesContext);

  const constraintsLookup = useMemo(() => {
    const foundModule = modules.find((item) => item.name === node?.data.label);
    return (
      foundModule?.parameters.reduce((acc, { name, constraints }) => {
        acc[name] = constraints;
        return acc;
      }, {} as ConstraintsLookupType) ?? {}
    );
  }, [modules, node?.data.label]);

  useImperativeHandle(
    ref,
    () => ({
      getTempNode: () => tempNode ?? null,
    }),
    [tempNode],
  );

  const getInputType = (key: string, value: NodeParamValue) => {
    if (typeof value === "string" && Array.isArray(constraintsLookup[key]))
      return "select";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return "text";
  };

  const handleParamChange = useCallback(
    (key: string, value: ParamValueType) => {
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

    const min = Number(constraintsLookup[key]?.[0]) ?? 0;
    const max = Number(constraintsLookup[key]?.[1]) ?? 100;

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
    handleParamChange(key, clampedValue);
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
    const inputType = getInputType(key, value);

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
            onChange={(e) => handleParamChange(key, e.target.value)}
            sx={{ mb: 2 }}
          >
            {Array.isArray(constraintsLookup[key]) &&
              constraintsLookup[key].map((option) => (
                <MenuItem key={`${key}-${option}`} value={String(option)}>
                  {option}
                </MenuItem>
              ))}
          </TextField>
        );

      case "number":
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
              min={Number(constraintsLookup[key]?.[0] ?? 0)}
              max={Number(constraintsLookup[key]?.[1]) ?? 100}
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
            size="small"
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
}

export default forwardRef(ParameterConfiguration);
