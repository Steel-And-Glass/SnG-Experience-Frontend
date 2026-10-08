import type { NextConfig } from "next";

const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/+$/, "");
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { protocol: "https", hostname: "pub-f40cbe6c02d1403d8748e1c68e3300a9.r2.dev", port: "", pathname: "/experience/**", search: "" },
];
// Also allow the explicitly configured media origin when moving to a custom domain.
if (mediaBaseUrl) {
  try {
    const url = new URL(mediaBaseUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      remotePatterns.push({ protocol: url.protocol === "https:" ? "https" : "http", hostname: url.hostname,
        port: url.port, pathname: `${url.pathname.replace(/\/+$/, "")}/experience/**`, search: "" });
    }
  } catch {
    // An absent or malformed origin must not prevent loading the Next config.
  }
}
const nextConfig: NextConfig = { images: { remotePatterns } };

export default nextConfig;
