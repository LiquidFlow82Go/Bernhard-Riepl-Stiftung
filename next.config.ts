import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Früherer Name des Bereichs: alte Links (z. B. aus E-Mails) weiterleiten
  async redirects() {
    return [
      { source: "/stiftungsrat", destination: "/stiftungsvorstand", permanent: true },
      { source: "/stiftungsrat/:pfad*", destination: "/stiftungsvorstand/:pfad*", permanent: true },
    ];
  },
};

export default nextConfig;
