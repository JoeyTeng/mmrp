export type ParamOptionType = string | number | string[];

export type ParamValueType = string | number;

export type ModuleConfig = {
  params: Record<string, ParamOptionType>;
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

/** Function that gets a single initial value for a param**/

export function getInitialNodeParamValue(
  moduleConfig: Record<string, ParamOptionType>
): Record<string, ParamValueType> {
  return Object.fromEntries(
    Object.entries(moduleConfig).map(([k, v]) => [
      k,
      Array.isArray(v)
        ? (v[0] as ParamValueType) // first option as default
        : (v as ParamValueType), // or keep the primitive
    ])
  ) as Record<string, ParamValueType>;
}