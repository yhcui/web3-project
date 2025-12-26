import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://180.96.6.32:9988/api/v1/:path*", // 开发环境
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // i18n 配置在 App Router 中不再支持，需通过中间件或组件处理
  // eslint 配置在 next.config.ts 中已废弃，默认会检查

  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 尝试解决 pino/thread-stream 的构建问题
  transpilePackages: ['pino', 'thread-stream', '@rainbow-me/rainbowkit', 'wagmi'],
  
  // 如果还有问题，可以尝试 webpack 配置兜底（但在 turbopack 模式下可能无效）
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },

  output: "standalone",
};

export default nextConfig;
