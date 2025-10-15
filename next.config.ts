import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow Server Actions from forwarded GitHub Codespaces URLs
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'turbo-fiesta-g45xqpjv6w5xfvpxw-3000.app.github.dev',
        '*.app.github.dev',
      ],
    },
  },
};

export default nextConfig;
