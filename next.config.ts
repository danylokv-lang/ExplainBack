import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Wires up Cloudflare bindings (D1, secrets) inside `next dev`, proxied
// through wrangler, so local development matches the deployed Worker
// without needing `wrangler dev` for everyday work.
initOpenNextCloudflareForDev();
