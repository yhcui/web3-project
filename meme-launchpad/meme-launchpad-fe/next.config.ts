import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.coinroll.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.metanode.tech',
        pathname: '/**',
      },
    ],
    domains: ['static.coinroll.io'],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
