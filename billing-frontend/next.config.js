/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable source maps in development to improve performance
  productionBrowserSourceMaps: false,
  env: {
    // NEXT_PUBLIC_API_URL is now dynamically detected in src/lib/api.ts
    // Only set it here if you want to override the dynamic detection
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Enable hot reloading and fast refresh 
  experimental: {
    // Enable faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'], 
          as: '*.js',
        },
      },
    },
  },
  // Webpack configuration for better development experience
  webpack: (config, { dev, isServer }) => {
    // Disable source maps completely for both dev and production, client and server
    config.devtool = false;
    
    if (dev && !isServer) {
      // Enable hot reloading
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    // @mui/x-charts has been uninstalled, but keep this as a safeguard
    // in case it gets reinstalled accidentally
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@mui\/x-charts/,
      })
    );
    
    return config
  },
  // Enable fast refresh
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Rewrite rules to proxy uploads from backend
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.10.203:8001'}/uploads/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

