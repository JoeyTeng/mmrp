"use client";
import { createContext, useMemo, ReactNode } from "react";
import { useExamplePipelines } from "@/hooks/useExamplePipelines";
import type { ExamplePipeline } from "@/types/pipeline";

export const ExamplePipelinesContext = createContext<{
  pipelines: ExamplePipeline[];
  loading: boolean;
}>({ pipelines: [], loading: true });

export function ExamplePipelinesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { pipelines, loading } = useExamplePipelines();
  const value = useMemo(() => ({ pipelines, loading }), [pipelines, loading]);
  return (
    <ExamplePipelinesContext.Provider value={value}>
      {children}
    </ExamplePipelinesContext.Provider>
  );
}
