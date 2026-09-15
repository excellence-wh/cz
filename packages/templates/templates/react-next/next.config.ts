import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 固定 Turbopack 的工作区根，避免在 monorepo / 上层目录存在锁文件时误判。
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
