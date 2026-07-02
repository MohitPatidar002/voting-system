import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // The portal is never meant to be embedded — blocks clickjacking of
          // the vote/apply buttons. (reCAPTCHA iframes FROM Google still work;
          // this only stops others from framing US.)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
