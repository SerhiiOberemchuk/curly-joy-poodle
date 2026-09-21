import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  // Self-hosted on HostiQ: `next build` emits .next/standalone/server.js with
  // only the traced node_modules, so the server needs no `npm install`.
  output: "standalone",
  async headers() {
    return [
      {
        // nginx buffers proxied responses by default, which would hold back the
        // streamed parts of every Partial Prerender until the render finishes.
        source: "/:path*{/}?",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },
};

export default nextConfig;
