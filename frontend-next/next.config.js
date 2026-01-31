/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Указываем корневую директорию для Next.js, чтобы избежать конфликтов с lockfiles в родительской директории
  outputFileTracingRoot: require('path').join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
