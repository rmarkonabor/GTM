import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Inngest and other trusted external packages
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
