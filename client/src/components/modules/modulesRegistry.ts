export type ParamOptionType = string | number | string[];

export type ParamValueType = string | number;

// Describes the properties of the data flowing through a port.
export type FormatType = {
  resolution?: { width: number; height: number };
  frameRate?: number; // Frames per second
  pixelFormat?: string; // e.g., "YUV420", "RGB"
  colorSpace?: string; // e.g., "BT.709", "BT.2020"
};

// for multi-port support to extend from
// Each port has exactly one format
export type PortType = {
  id: string;
  label: string;
  formats: FormatType;
  transform?: (
    params: Record<string, ParamOptionType>,
    inputPorts: PortType[],
    baseFormats: FormatType,
  ) => FormatType;
};

export type ModuleConfig = {
  params: Record<string, ParamOptionType>;
  inputPorts: PortType[];
  outputPorts: PortType[];
};

export const moduleRegistry: Record<string, ModuleConfig> = {
  Source: {
    params: { path: "example-video-filter.mp4", format: "mp4" },
    inputPorts: [], // No input ports for a source node
    outputPorts: [
      {
        id: "output-0",
        label: "Video Output",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
  },
  Denoise: {
    params: { strength: 0.5 },
    inputPorts: [
      {
        id: "input-0",
        label: "Video Input",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
    outputPorts: [
      {
        id: "output-0",
        label: "Denoised Video Output",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
  },
  Encode: {
    params: { bitrate: 1000, codec: ["h264"] },
    inputPorts: [
      {
        id: "input-0",
        label: "Video Input",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
    outputPorts: [
      {
        id: "output-0",
        label: "Encoded Video",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "H264",
        },
      },
    ],
  },
  Decode: {
    params: { codec: ["h264", "AV1"] },
    inputPorts: [
      {
        id: "input-0",
        label: "Encoded Video Input",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "rgb24",
        },
      },
    ],
    outputPorts: [
      {
        id: "output-0",
        label: "Decoded Video Output",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
      {
        id: "output-1",
        label: "Decoded Video Output",
        formats: {
          resolution: { width: 960, height: 540 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      }, // testing ports / works OK needs styling as there seems to be a overlap
    ],
  },
  UpSample: {
    params: { factor: 2 },
    inputPorts: [
      {
        id: "input-0",
        label: "Video Input",
        formats: {
          resolution: { width: 960, height: 540 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
    outputPorts: [
      {
        id: "output-0",
        label: "Upsampled Video Output",
        formats: {
          resolution: { width: 1920, height: 1080 }, // Upscaled by factor 2
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
  },
  DownSample: {
    params: { factor: 1 },
    inputPorts: [
      {
        id: "input-0",
        label: "Video Input",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
    outputPorts: [
      {
        id: "output-0",
        label: "Downsampled Video Output",
        formats: {
          resolution: { width: 960, height: 540 }, // Downscaled by factor 2
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
        transform: (params, inputPorts, baseFormats) => {
          // 1) find exactly the port we want by ID:
          const source = inputPorts.find((p) => p.id === "input-0")!;
          const factor = Number(params.factor);
          const { width, height } = source.formats.resolution!;
          return {
            ...baseFormats,
            resolution: {
              width: Math.floor(width / factor), // scale down
              height: Math.floor(height / factor), // scale down
            },
          };
        },
      },
    ],
  },
  Result: {
    params: { path: "out.mp4" },
    inputPorts: [
      {
        id: "input-0",
        label: "Final Video Input",
        formats: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          pixelFormat: "YUV420",
          colorSpace: "BT.709",
        },
      },
    ],
    outputPorts: [], // No outputs for the Result node
  },
};

/** Function that gets a single initial value for a param**/

export function getInitialNodeParamValue(
  moduleConfig: Record<string, ParamOptionType>,
): Record<string, ParamValueType> {
  return Object.fromEntries(
    Object.entries(moduleConfig).map(([k, v]) => [
      k,
      Array.isArray(v)
        ? (v[0] as ParamValueType) // first option as default
        : (v as ParamValueType), // or keep the primitive
    ]),
  ) as Record<string, ParamValueType>;
}

/**
 * Helper Function
 */
export function getPortsForNode(
  name: string,
  params: Record<string, ParamOptionType>,
): { inputPorts: PortType[]; outputPorts: PortType[] } {
  const config = moduleRegistry[name] as ModuleConfig;
  const ins = config.inputPorts;
  const outs = config.outputPorts.map((port) => {
    if (!port.transform) {
      return port;
    }
    // Pass the port’s own formats as baseFormats
    const newFormats = port.transform(params, ins, port.formats);
    return { ...port, formats: newFormats };
  });
  return { inputPorts: ins, outputPorts: outs };
}
