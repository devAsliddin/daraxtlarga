/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

// Load .env.capacitor when BUILD_TARGET=capacitor
if (process.env.BUILD_TARGET === 'capacitor') {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env.capacitor'), 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) process.env[key] = value;
    });
  } catch {}
}

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const isCapacitor = process.env.BUILD_TARGET === 'capacitor';

const nextConfig = {
  reactStrictMode: true,
  output: isCapacitor ? 'export' : undefined,
  trailingSlash: isCapacitor ? true : false,
  images: {
    domains: ['localhost', 'minio', '192.168.12.152'],
    unoptimized: true,
  },
  ...(isCapacitor
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
            },
          ];
        },
      }),
};

module.exports = isCapacitor ? nextConfig : withPWA(nextConfig);
