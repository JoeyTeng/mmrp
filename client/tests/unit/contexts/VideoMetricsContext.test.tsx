import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  VideoMetricsProvider,
  useVideoMetrics,
} from "@/contexts/VideoMetricsContext";
import { Metrics } from "@/types/metrics";

const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <VideoMetricsProvider>{children}</VideoMetricsProvider>
);

describe("VideoMetricsContext", () => {
  it("provides initial defaults", () => {
    const { result } = renderHook(() => useVideoMetrics(), { wrapper });
    expect(result.current.metrics).toEqual([]);
    expect(result.current.currentFrame).toBe(0);
  });

  it("setMetrics updates metrics", () => {
    const { result } = renderHook(() => useVideoMetrics(), { wrapper });
    const mock: Metrics[] = [{ psnr: 30, ssim: 0.9 }];

    act(() => {
      result.current.setMetrics(mock);
    });

    expect(result.current.metrics).toEqual(mock);
  });

  it("setCurrentFrame updates frame", () => {
    const { result } = renderHook(() => useVideoMetrics(), { wrapper });

    act(() => {
      result.current.setCurrentFrame(5);
    });

    expect(result.current.currentFrame).toBe(5);
  });

  it("throws if used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useVideoMetrics())).toThrow(
      "useVideoMetrics must be used within VideoMetricsProvider",
    );
    spy.mockRestore();
  });
});
