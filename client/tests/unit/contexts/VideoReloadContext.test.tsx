import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  VideoReloadProvider,
  useVideoReload,
} from "@/contexts/VideoReloadContext";
import {
  VideoMetricsProvider,
  useVideoMetrics,
} from "@/contexts/VideoMetricsContext";
import { PipelineResponse } from "@/types/pipeline";

// Wrap both providers in one tree
const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <VideoMetricsProvider>
    <VideoReloadProvider>{children}</VideoReloadProvider>
  </VideoMetricsProvider>
);

describe("VideoReloadContext", () => {
  // Ensure revokeObjectURL exists
  beforeAll(() => {
    global.URL.revokeObjectURL = jest.fn();
  });
  beforeEach(() => {
    (URL.revokeObjectURL as jest.Mock).mockClear();
  });

  it("provides initial defaults", () => {
    const { result } = renderHook(() => useVideoReload(), { wrapper });
    expect(result.current.latestResponse).toBeNull();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isProcessingError).toBe(false);
    expect(result.current.getLatestVideoInfo("left")).toEqual({
      url: "",
      size: 0,
    });
  });

  it("toggles processing and error flags", () => {
    const { result } = renderHook(() => useVideoReload(), { wrapper });

    act(() => {
      result.current.setIsProcessing(true);
      result.current.setError(true);
    });

    expect(result.current.isProcessing).toBe(true);
    expect(result.current.isProcessingError).toBe(true);
  });

  it("setLatestVideoInfo revokes old URL and sets new one, no-op on same URL", () => {
    const { result } = renderHook(() => useVideoReload(), { wrapper });

    // First set: no revoke
    act(() => {
      result.current.setLatestVideoInfo("right", "blob1", 100);
    });
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(result.current.getLatestVideoInfo("right")).toEqual({
      url: "blob1",
      size: 100,
    });

    // Change URL: should revoke old
    act(() => {
      result.current.setLatestVideoInfo("right", "blob2", 200);
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob1");
    expect(result.current.getLatestVideoInfo("right")).toEqual({
      url: "blob2",
      size: 200,
    });

    // Same URL again: no additional revoke
    act(() => {
      result.current.setLatestVideoInfo("right", "blob2", 200);
    });
    expect((URL.revokeObjectURL as jest.Mock).mock.calls.length).toBe(1);
  });

  it("setLatestVideoInfo defaults size to zero when undefined", () => {
    const { result } = renderHook(() => useVideoReload(), { wrapper });
    act(() => {
      // only two args, size omitted
      result.current.setLatestVideoInfo("left", "blob3");
    });
    expect(result.current.getLatestVideoInfo("left")).toEqual({
      url: "blob3",
      size: 0, // <-- covers the `size ?? 0` branch
    });
  });

  it("triggerReload updates latestResponse and resets metrics+frame", () => {
    // Combine both hooks in one render so they share the same provider
    const { result } = renderHook(
      () => {
        const reload = useVideoReload();
        const metrics = useVideoMetrics();
        return { reload, metrics };
      },
      { wrapper },
    );

    const mockResp: PipelineResponse = {
      left: "l.mp4",
      right: "r.mp4",
      metrics: [{ psnr: 42, ssim: 0.98 }],
    };

    act(() => {
      result.current.reload.triggerReload(mockResp);
    });

    // reload context
    expect(result.current.reload.latestResponse).toEqual(mockResp);
    // metrics context
    expect(result.current.metrics.currentFrame).toBe(0);
    expect(result.current.metrics.metrics).toEqual(mockResp.metrics);
  });

  it("throws if used outside provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useVideoReload())).toThrow(
      "VideoReloadContext missing",
    );
    jest.restoreAllMocks();
  });
});
