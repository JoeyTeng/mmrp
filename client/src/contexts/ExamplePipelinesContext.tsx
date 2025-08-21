"use client";

import { createContext, useMemo, ReactNode, useContext } from "react";
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
    <ExamplePipelinesContext value={value}>{children}</ExamplePipelinesContext>
  );
}

export const useExamplePipelinesContext = () => {
  const ctx = useContext(ExamplePipelinesContext);
  if (!ctx)
    throw new Error(
      "useExamplePipelinesContext must be used within ExamplePipelinesProvider",
    );
  return ctx;
};
