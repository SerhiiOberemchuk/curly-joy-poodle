import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  images: {
    // Product, category and collection photos uploaded in obriym-crm.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/workspaces/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
