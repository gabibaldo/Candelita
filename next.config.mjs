/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pdf-lib", "node-cron"],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
