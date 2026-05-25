/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      // Только маршруты без своего Route Handler в app/api/*
      // НЕ проксируем: /api/bff/* (JWT из cookies), /api/auth/*, /api/products, /api/orders, ...
      {
        source: '/api/analytics/:path*',
        destination: `${apiBase}/api/analytics/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
