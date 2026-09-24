import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.muji.net",
        pathname: "/img/item/**",
      },
      {
        protocol: "https",
        hostname: "image.uniqlo.com",
        pathname: "/UQ/ST3/sg/imagesgoods/**",
      },
      {
        protocol: "https",
        hostname: "contents.mediadecathlon.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
