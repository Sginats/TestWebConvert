/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'pdf-parse', 'argon2', '@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('argon2');
    }
    return config;
  },
};

module.exports = nextConfig;
