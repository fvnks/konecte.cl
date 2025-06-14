
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'bukmy.cl',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // Added for www.bukmy.cl as per the error
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    // This key is now removed/renamed
  },
  // Corrected key:
  serverExternalPackages: [
    'handlebars',
    'dotprompt',
    '@genkit-ai/core',
    // 'genkit', // genkit main package might also be included if issues persist
    // '@genkit-ai/googleai', // and googleai plugin
  ],
};

export default nextConfig;


