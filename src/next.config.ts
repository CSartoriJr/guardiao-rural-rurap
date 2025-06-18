
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1749831716891.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
