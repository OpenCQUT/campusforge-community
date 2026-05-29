import type { NextConfig } from "next";
import withNextIntl from "./next-intl.config";

const nextConfig: NextConfig = {
  transpilePackages: ["@campusforge/shared"],
};

export default withNextIntl(nextConfig);
