/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only export to static for Capacitor (local build).
  // On Vercel, we want the default output to support API routes (serverless functions).
  output: process.env.VERCEL ? undefined : 'export',
  // Use 'www' for local Capacitor builds, but defaults to '.next' for Vercel.
  distDir: process.env.VERCEL ? undefined : 'www',
  // Use relative asset paths (./) for Capacitor builds, but defaults to '/' for Vercel.
  assetPrefix: process.env.VERCEL ? undefined : './',
  images: {
    unoptimized: true,
  },

  // Disable Turbopack — Pages Router + Turbopack has ISR manifest bugs in Next.js 16
  experimental: {},

  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        // Headers for Firebase/Auth popup communication
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
