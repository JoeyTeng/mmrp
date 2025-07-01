"use client";

import { createContext } from "react";
import type { ModuleMeta } from "@/hooks/useModule";

export const ModulesContext = createContext<ModuleMeta[]>([]);
