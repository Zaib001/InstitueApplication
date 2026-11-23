/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking is independently verified via `npm run typecheck`
    // Disabling during build prevents Render 512MB RAM OOM crashes
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting is independently verified
    // Disabling during build prevents Render 512MB RAM OOM crashes
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
