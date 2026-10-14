import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // lint/typecheck은 npm run lint / tsc --noEmit로 별도 검증하므로 빌드 시 메모리 절약을 위해 생략
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
