export enum ViewOptions {
  SideBySide = "Side-by-Side",
  Interleaving = "Interleaving Frames",
}

export interface MenuDropdownProps {
  onSelect: (view: ViewOptions) => void;
}
