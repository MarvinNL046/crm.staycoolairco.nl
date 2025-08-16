/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['messagebird', '@supabase/supabase-js', '@supabase/ssr'],
  
  // Disable Edge Runtime warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@supabase/supabase-js', '@supabase/ssr')
    }
    return config
  }
}

module.exports = nextConfig