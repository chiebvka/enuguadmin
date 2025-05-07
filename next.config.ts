import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zuelvssw8o.ufs.sh',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-d421b0fc5c554a00b338fe82fcc1d645.r2.dev',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**'
      }
    ],
  },
};

export default nextConfig;
