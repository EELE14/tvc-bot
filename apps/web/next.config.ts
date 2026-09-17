import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  transpilePackages: ["@tvc/core", "@tvc/db"],
  serverExternalPackages: ["@prisma/adapter-pg"],
};

export default config;
