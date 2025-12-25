import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envStatus = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ? '✅ 已设置' : '❌ 未设置',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ 已设置' : '❌ 未设置',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? '✅ 已设置' : '❌ 未设置',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY ? '✅ 已设置' : '❌ 未设置',
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json({
    message: '环境变量状态检查',
    status: envStatus,
    note: '此端点显示 Next.js 应用内部的环境变量加载状态'
  });
}
















