/** @type {import('next').NextConfig} */
const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig = {
  transpilePackages: ['lucide-react', 'recharts', 'react-dropzone'],
  // Private areas (candidate, employer, admin portals) must never appear in search results
  async headers() {
    return ['/admin/:path*', '/employer/:path*', '/candidate/:path*', '/onboarding/:path*', '/api/:path*'].map((source) => ({ source, headers: noindex }));
  },
  // Renamed role pages keep their old URLs working for search engines and shared links
  async redirects() {
    return [{ source: '/hire/technology/junior-software-developer', destination: '/hire/technology/software-developer', permanent: true }];
  },
};

export default nextConfig;
