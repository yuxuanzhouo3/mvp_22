/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 移除 standalone 输出模式，Vercel 使用 serverless 模式
  // output: 'standalone', // 注释掉或移除这一行
}

export default nextConfig
