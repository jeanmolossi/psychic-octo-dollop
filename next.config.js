/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'your-project.supabase.co',
                pathname: '/storage/**',
                port: ''
            }
        ],
    }
}

module.exports = nextConfig
