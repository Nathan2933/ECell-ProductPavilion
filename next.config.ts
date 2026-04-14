import type { NextConfig } from "next";

/**
 * Dev server origin checks: allow tunneled hosts (ngrok, etc.) to load `/_next/*`, HMR, and RSC payloads.
 * Set `NEXT_PUBLIC_APP_URL` to your public https URL so QR links and sessions match the tunnel.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "127.0.0.1",
  ],
};

export default nextConfig;
