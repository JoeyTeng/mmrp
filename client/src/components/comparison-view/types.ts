import { Metrics } from "@/types/metrics";

export enum ViewOptions {
  SideBySide = "Side-by-Side",
  Interleaving = "Interleaving Frames",
}

export enum VideoType {
  Video = "Video",
  Stream = "Stream of frames",
}

export interface MenuDropdownProps {
  onSelect: (view: ViewOptions) => void;
}

export type FrameData = {
  blob: Blob[];
  fps: number;
  mime: string;
  metrics?: Metrics;
};
