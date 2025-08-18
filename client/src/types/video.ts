export type VideoMap = "left" | "right";
export type VideoRecordMap = Record<VideoMap, VideoInfo | null>;

export type VideoInfoRequest = {
  name: string;
  output: boolean;
};

export type VideoInfo = {
  name: string;
  url: string;
  size: number;
};
