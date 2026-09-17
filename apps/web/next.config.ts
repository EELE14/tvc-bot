import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@tvc/core", "@tvc/db"],
};

export default config;
