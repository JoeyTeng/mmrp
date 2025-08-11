"use client";

import { ExamplePipeline } from "@/types/pipeline";
import { createContext } from "react";

export const ExamplePipelinesContext = createContext<ExamplePipeline[]>([]);
