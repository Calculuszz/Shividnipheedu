import type { NextConfig } from "next";

const WEEK = 60 * 60 * 24 * 7;
const YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  images: {
    // AVIF first (smallest), WebP as fallback for older browsers
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: WEEK,
  },
  async headers() {
    return [
      {
        // Fonts never change under the same name
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${YEAR}, immutable` }],
      },
      ...["/illustrations/:path*", "/brand/:path*", "/ghosts/:path*", "/questions/:path*", "/sponsors/:path*"].map(
        (source) => ({
          source,
          // A week is long enough for repeat visits, short enough that swapped artwork shows up
          headers: [{ key: "Cache-Control", value: `public, max-age=${WEEK}, stale-while-revalidate=86400` }],
        })
      ),
    ];
  },
};

export default nextConfig;
