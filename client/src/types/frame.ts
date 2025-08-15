import { Metrics } from "./metrics";

export type FrameData = {
  blob: Blob[];
  fps: number;
  mime: string;
  metrics?: Metrics;
};
