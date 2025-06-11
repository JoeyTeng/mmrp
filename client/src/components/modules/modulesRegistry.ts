type ModuleConfig = {
  params: Record<string, string | number | string[]>;
};

export const moduleRegistry: Record<string, ModuleConfig> = {
  Source: { params: { path: '', format: 'mp4' } },
  Denoise: { params: { strength: 0.5 } },
  Encode: { params: { bitrate: 1000, codec: ['h264'] } },
  Decode: { params: { codec: ['h264', 'AV1'] } },
  UpSample: { params: { factor: 2 } },
  DownSample: { params: { factor: 2 } },
  Result: { params: { path: 'out.mp4' } },
};