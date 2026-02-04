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
      {
        protocol: 'http',
        hostname: '192.168.**',
      },
      {
        protocol: 'http',
        hostname: '10.**',
      },
      {
        protocol: 'http',
        hostname: '172.**',
      },
    ],
  },
};

module.exports = nextConfig;
