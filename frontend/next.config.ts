import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백엔드 API URL 설정 (서버사이드)
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://localhost:3001",
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
