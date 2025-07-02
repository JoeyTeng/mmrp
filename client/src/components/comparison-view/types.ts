export enum ViewOptions {
  SideBySide = "Side-by-Side",
  Interleaving = "Interleaving Frames",
}

export enum VideoType {
  Video = "Video",
  Stream = "Stream of frames",
}

export type MenuSelection = {
  view: ViewOptions;
  type: VideoType;
};

export interface MenuDropdownProps {
  onSelect: (view: MenuSelection) => void;
}

export type FrameData = {
  blob: Blob[];
  fps: number;
  mime: string;
  count: number;
};
