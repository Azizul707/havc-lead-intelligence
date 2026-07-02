import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
};

export default nextConfig;
