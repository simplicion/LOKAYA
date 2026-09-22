import path from "path";
import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT === "export" || process.env.CF_PAGES === "1" || process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  output: isExport ? "export" : "standalone",
  turbopack: {
    root: path.resolve(__dirname, "../../../"),
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
