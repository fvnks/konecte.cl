
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
        pathname: '/img/**', // Patrón específico para la carpeta de imágenes
      },
      {
        protocol: 'https',
        hostname: 'bukmy.cl',
        port: '',
        pathname: '/**',   // Patrón general de respaldo para bukmy.cl
      },
      // Para www.bukmy.cl (en caso de redirección y servicio final desde aquí)
      {
        protocol: 'https',
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/img/**', // Patrón específico para la carpeta de imágenes
      },
      {
        protocol: 'https',
        hostname: 'www.bukmy.cl',
        port: '',
        pathname: '/**',   // Patrón general de respaldo para www.bukmy.cl
      }
      // Se eliminó la entrada http://www.bukmy.cl
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
