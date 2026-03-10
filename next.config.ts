import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Wildcard subdomain support requires the host to be added here
  // when using Next.js Image Optimization across tenants.
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
