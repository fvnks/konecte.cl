
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
      // Para bukmy.cl (URL original en el código)
      {
        protocol: 'https',
        hostname: 'bukmy.cl',
        port: '',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'bukmy.cl',
        port: '',
        pathname: '/**',
      },
      // Para www.bukmy.cl (en caso de redirección y servicio final desde aquí)
      {
        protocol: 'https',
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/**',
      },
      // NUEVA REGLA: Permitir HTTP para www.bukmy.cl
      {
        protocol: 'http',
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/**', // Permitir cualquier ruta bajo este host HTTP
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

