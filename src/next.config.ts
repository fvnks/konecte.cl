
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  serverExternalPackages: [
    'handlebars',
    'dotprompt',
    '@genkit-ai/core',
    'genkit', 
    '@genkit-ai/googleai',
    'mysql2',
    'bcryptjs',
  ],
};

export default nextConfig;
