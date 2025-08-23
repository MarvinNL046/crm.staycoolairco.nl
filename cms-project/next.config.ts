import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'standalone' for Netlify deployment
  // output: 'standalone',
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
