import { loadVideo } from "@/services/videoService";
import { apiClient } from "@/services/apiClient";

jest.mock("@/services/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "/videos");
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("loadVideo", () => {
  const mockBlob = new Blob(["video data"], { type: "video/mp4" });
  const videoName = "test-video.mp4";

  it("sets the video ref src and returns url and size", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: mockBlob });

    const mockRef = {
      current: { src: "" },
    } as React.RefObject<HTMLVideoElement>;

    const result = await loadVideo(videoName, false, mockRef);

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/video/",
      { video_name: videoName, output: false },
      { responseType: "blob" },
    );

    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockRef.current!.src).toBe("/videos");
    expect(result).toEqual({ url: "/videos", size: mockBlob.size });
  });

  it("handles case when ref.current is null", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: mockBlob });

    const mockRef = {
      current: null,
    } as React.RefObject<HTMLVideoElement | null>;

    const result = await loadVideo(videoName, true, mockRef);

    expect(result).toEqual({ url: "/videos", size: mockBlob.size });
  });

  it("throws and logs error on API failure", async () => {
    const error = new Error("Network error");
    mockedApiClient.post.mockRejectedValueOnce(error);

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockRef = {
      current: { src: "" },
    } as React.RefObject<HTMLVideoElement>;

    await expect(loadVideo(videoName, false, mockRef)).rejects.toThrow(
      "Network error",
    );

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
