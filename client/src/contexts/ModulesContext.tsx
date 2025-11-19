// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useModules } from "@/hooks/useModule";
import { Module } from "@/types/module";
import { createContext, ReactNode, useContext } from "react";

type ModulesContextType = {
  modules: Module[];
  reloadModules: () => void;
};

const ModulesContext = createContext<ModulesContextType | undefined>(undefined);

export const useModulesContext = () => {
  const context = useContext(ModulesContext);
  if (!context) throw new Error("ModulesContext must be used within provider");
  return context;
};

export const ModulesProvider = ({ children }: { children: ReactNode }) => {
  const { modules, reloadModules } = useModules();

  return (
    <ModulesContext value={{ modules, reloadModules }}>
      {children}
    </ModulesContext>
  );
};
