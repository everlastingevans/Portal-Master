/** @type {import('next').NextConfig} */
const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig = {
  transpilePackages: ['lucide-react', 'recharts', 'react-dropzone'],
  // Private areas (candidate, employer, admin portals) must never appear in search results
  async headers() {
    return ['/admin/:path*', '/employer/:path*', '/candidate/:path*', '/onboarding/:path*', '/api/:path*'].map((source) => ({ source, headers: noindex }));
  },
};

export default nextConfig;
