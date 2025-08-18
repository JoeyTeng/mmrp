import { renderHook } from "@testing-library/react";
import { useVideoService } from "@/services/videoService";
import { apiClient } from "@/services/apiClient";

jest.mock("@/services/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "/videos");
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("useVideoService", () => {
  describe("loadVideo", () => {
    const mockBlob = new Blob(["video data"], { type: "video/mp4" });
    const videoName = "test-video.mp4";

    it("should load video successfully", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: mockBlob });

      const { result } = renderHook(() => useVideoService());
      const response = await result.current.loadVideo({
        name: videoName,
        output: false,
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/video/",
        { video_name: videoName, output: false },
        { responseType: "blob" },
      );

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(response).toEqual({
        name: videoName,
        url: "/videos",
        size: mockBlob.size,
      });
    });

    it("should throw error when API fails", async () => {
      const error = new Error("Network error");
      mockedApiClient.post.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoService());

      await expect(
        result.current.loadVideo({ name: videoName, output: false }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("uploadVideo", () => {
    const mockFile = new File(["video content"], "test.mp4", {
      type: "video/mp4",
    });

    it("should upload video successfully", async () => {
      const mockResponse = { data: { filename: "temp_file.mp4" } };
      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useVideoService());
      const response = await result.current.uploadVideo(mockFile);

      const formData = mockedApiClient.post.mock.calls[0][1] as FormData;
      expect(formData.get("file")).toBe(mockFile);

      expect(response).toEqual(mockResponse.data);
    });

    it("should log error when upload fails", async () => {
      const error = new Error("Upload failed");
      mockedApiClient.post.mockRejectedValueOnce(error);

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useVideoService());
      await expect(result.current.uploadVideo(mockFile)).rejects.toThrow(
        "Upload failed",
      );

      expect(consoleSpy).toHaveBeenCalledWith("Error uploading video", error);
      consoleSpy.mockRestore();
    });
  });
});
