import { NextResponse } from 'next/server'

/**
 * Vercel 部署诊断 API
 * 检查环境变量和配置状态
 */
export async function GET() {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'unknown',
      vercel_url: process.env.VERCEL_URL || 'unknown'
    },
    environment_variables: {
      // 公共环境变量（应该在客户端可用）
      NEXT_PUBLIC_SUPABASE_URL: {
        set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      },
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
        set: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'configured' : 'missing'
      },
      NEXT_PUBLIC_APP_URL: {
        set: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || 'missing',
        matches_vercel: process.env.NEXT_PUBLIC_APP_URL?.includes(process.env.VERCEL_URL || '') || false
      },

      // 服务端环境变量
      SUPABASE_SERVICE_ROLE_KEY: {
        set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      },
      GITHUB_CLIENT_ID: {
        set: !!process.env.GITHUB_CLIENT_ID,
        value: process.env.GITHUB_CLIENT_ID ? 'configured' : 'missing'
      },
      GITHUB_CLIENT_SECRET: {
        set: !!process.env.GITHUB_CLIENT_SECRET,
        value: process.env.GITHUB_CLIENT_SECRET ? 'configured' : 'missing'
      },
      STRIPE_SECRET_KEY: {
        set: !!process.env.STRIPE_SECRET_KEY,
        value: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing'
      },
      STRIPE_WEBHOOK_SECRET: {
        set: !!process.env.STRIPE_WEBHOOK_SECRET,
        value: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing'
      }
    },
    configuration_issues: [] as string[],
    recommendations: [] as string[]
  }

  // 检查配置问题
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnostic.configuration_issues.push('NEXT_PUBLIC_SUPABASE_URL is missing')
    diagnostic.recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    diagnostic.configuration_issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    diagnostic.recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    diagnostic.configuration_issues.push('NEXT_PUBLIC_APP_URL is missing')
    diagnostic.recommendations.push('Set NEXT_PUBLIC_APP_URL to your Vercel domain (https://your-app.vercel.app)')
  } else if (process.env.VERCEL_URL && !process.env.NEXT_PUBLIC_APP_URL.includes(process.env.VERCEL_URL)) {
    diagnostic.configuration_issues.push('NEXT_PUBLIC_APP_URL does not match Vercel domain')
    diagnostic.recommendations.push(`Update NEXT_PUBLIC_APP_URL to match your Vercel domain: https://${process.env.VERCEL_URL}`)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    diagnostic.configuration_issues.push('SUPABASE_SERVICE_ROLE_KEY is missing')
    diagnostic.recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables')
  }

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    diagnostic.configuration_issues.push('GitHub OAuth credentials are missing')
    diagnostic.recommendations.push('Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel environment variables')
  }

  return NextResponse.json(diagnostic, {
    headers: {
      'Cache-Control': 'no-cache', // 不缓存诊断结果
    }
  })
}
