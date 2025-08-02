"use client";

import { Module } from "@/types/module";
import { createContext } from "react";

export const ModulesContext = createContext<Module[]>([]);
