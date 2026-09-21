import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.muji.net",
        pathname: "/img/item/**",
      },
    ],
  },
};

export default nextConfig;
