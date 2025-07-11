"use client";

import { ModuleMeta } from "@/types/module";
import { createContext } from "react";

export const ModulesContext = createContext<ModuleMeta[]>([]);
