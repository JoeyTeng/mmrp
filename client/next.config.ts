import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static export (puts files in client/out)
  images: { unoptimized: true },
};

export default nextConfig;
