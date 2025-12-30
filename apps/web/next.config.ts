import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@form-builder/ui", "@form-builder/database", "@form-builder/email"],
};

export default nextConfig;

