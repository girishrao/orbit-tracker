import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // Next.js 16 default; CesiumJS assets are pre-copied via postinstall
};

export default nextConfig;
