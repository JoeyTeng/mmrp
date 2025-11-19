// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static export (puts files in client/out)
  images: { unoptimized: true },
};

export default nextConfig;
