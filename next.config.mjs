/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // Para imágenes de Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Para randomuser.me (avatares de ejemplo)
      {
        protocol: 'https',
        hostname: 'randomuser.me',
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
  compiler: {
    styledComponents: true,
  },
  // Allow requests from the Firebase Studio development environment
  experimental: {
    allowedDevOrigins: [
        "https://9000-firebase-studio-1749651587478.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev"
    ],
  },
};

export default nextConfig;
