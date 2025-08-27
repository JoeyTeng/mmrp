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
