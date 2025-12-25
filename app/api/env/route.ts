import { NextResponse } from 'next/server'

/**
 * API 路由：返回前端需要的环境变量
 * Vercel 部署时，前端无法直接访问环境变量，需要通过此 API 获取
 */
export async function GET() {
  try {
    console.log('API /env called - fetching environment variables')

    // 只返回前端需要的、安全的公共环境变量
    // 不返回敏感信息（如 SECRET_KEY、SERVICE_ROLE_KEY 等）
    const publicEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    }

    // 检查必要的环境变量是否存在
    const missingVars = Object.entries(publicEnv)
      .filter(([key, value]) => !value && key !== 'NEXT_PUBLIC_APP_URL') // NEXT_PUBLIC_APP_URL 可以为空
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.warn(`Missing environment variables: ${missingVars.join(', ')}`)
    }

    console.log('Environment variables fetched successfully:', Object.keys(publicEnv).filter(key => publicEnv[key as keyof typeof publicEnv]))

    // 设置缓存头，减少请求频率
    return NextResponse.json(publicEnv, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5分钟缓存
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching environment variables:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch environment variables',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}










