import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: [
    "http://100.102.85.62:3000",
    "http://100.102.85.62",
    "100.102.85.62:3000",
    "100.102.85.62",
    "100.94.133.107",
  ],
} as any;

export default nextConfig;
