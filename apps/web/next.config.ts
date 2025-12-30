import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@form-builder/ui", "@form-builder/database", "@form-builder/email", "@form-builder/config"],
};

export default nextConfig;

