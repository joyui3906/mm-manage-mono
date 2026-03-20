/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mm/shared", "@mm/prisma"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
