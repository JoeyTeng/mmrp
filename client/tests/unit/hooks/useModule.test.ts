import { renderHook, waitFor } from "@testing-library/react";
import { useModules } from "@/hooks/useModule";
import { apiClient } from "@/services/apiClient";

jest.mock("@/services/apiClient");
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockModulesSnakeCase = [
  {
    id: "blur",
    name: "blur",
    type: "processNode",
    position: { x: 0, y: 0 },
    data: {
      parameters: [
        {
          name: "kernel_size",
          metadata: {
            value: 5,
            type: "int",
            constraints: {
              type: "int",
              default: 5,
              required: true,
              description: null,
            },
          },
        },
        {
          name: "method",
          metadata: {
            value: "gaussian",
            type: "str",
            constraints: {
              type: "select",
              default: "gaussian",
              required: true,
              description: null,
              options: ["gaussian", "median", "bilateral"],
            },
          },
        },
      ],
      input_formats: [
        {
          pixel_format: "bgr24",
          color_space: "BT.709 Full",
          width: null,
          height: null,
          frame_rate: null,
        },
      ],
      output_formats: [
        {
          pixel_format: "bgr24",
          color_space: "BT.709 Full",
          width: null,
          height: null,
          frame_rate: null,
        },
      ],
    },
  },
];

const mockModulesCamelCase = [
  {
    id: "blur",
    name: "blur",
    type: "processNode",
    position: { x: 0, y: 0 },
    data: {
      parameters: [
        {
          name: "kernel_size",
          metadata: {
            value: 5,
            type: "int",
            constraints: {
              type: "int",
              default: 5,
              required: true,
              description: null,
            },
          },
        },
        {
          name: "method",
          metadata: {
            value: "gaussian",
            type: "str",
            constraints: {
              type: "select",
              default: "gaussian",
              required: true,
              description: null,
              options: ["gaussian", "median", "bilateral"],
            },
          },
        },
      ],
      inputFormats: [
        {
          pixelFormat: "bgr24",
          colorSpace: "BT.709 Full",
          width: null,
          height: null,
          frameRate: null,
        },
      ],
      outputFormats: [
        {
          pixelFormat: "bgr24",
          colorSpace: "BT.709 Full",
          width: null,
          height: null,
          frameRate: null,
        },
      ],
    },
  },
];

jest.mock("@/utils/camelize", () => ({
  camelizeKeys: jest.fn(() => mockModulesCamelCase),
}));

describe("useModules", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches modules and returns them camelized", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: mockModulesSnakeCase });

    const { result } = renderHook(() => useModules());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.modules).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith("/modules/");
    expect(result.current.modules).toEqual(mockModulesCamelCase);
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedApiClient.get.mockRejectedValueOnce(new Error("API failure"));

    const { result } = renderHook(() => useModules());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.modules).toEqual([]);

    consoleSpy.mockRestore();
  });
});
