import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백엔드 API URL 설정 (서버사이드)
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://localhost:3001",
  },
};

export default nextConfig;
