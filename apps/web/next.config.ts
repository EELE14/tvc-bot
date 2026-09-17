import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@tvc/core", "@tvc/db"],
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default config;
