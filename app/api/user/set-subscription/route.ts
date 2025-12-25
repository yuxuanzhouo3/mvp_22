import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the session from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tier, days = 30 } = body

    if (!tier || !['free', 'basic', 'pro', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // 检查 Supabase 是否配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Please set up your environment variables first.' },
        { status: 500 }
      )
    }

    const now = new Date()
    let newPeriodEnd: Date

    if (tier === 'free') {
      // 免费用户没有到期时间
      newPeriodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1年
    } else {
      // 付费用户设置到期时间
      newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    }

    // 更新或插入订阅记录
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingSubscription) {
      // 更新现有订阅
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          subscription_tier: tier,
          status: tier === 'free' ? 'inactive' : 'active',
          current_period_end: tier === 'free' ? null : newPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existingSubscription.id)
    } else {
      // 创建新订阅
      await supabaseAdmin.from('user_subscriptions').insert({
        user_id: user.id,
        subscription_tier: tier,
        status: tier === 'free' ? 'inactive' : 'active',
        current_period_start: now.toISOString(),
        current_period_end: tier === 'free' ? null : newPeriodEnd.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${tier}`,
      subscription: {
        tier,
        status: tier === 'free' ? 'inactive' : 'active',
        currentPeriodEnd: tier === 'free' ? null : newPeriodEnd.toISOString(),
      }
    })

  } catch (error) {
    console.error('Error in set subscription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
















