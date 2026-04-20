/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pdf-lib", "node-cron"],
};

export default nextConfig;
