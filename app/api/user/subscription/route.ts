import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
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

    const userId = user.id

    // 获取用户的订阅信息
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      )
    }

    // 获取用户的使用统计
    const { data: usageStats, error: usageError } = await supabaseAdmin
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (usageError) {
      console.error('Error fetching usage stats:', usageError)
    }

    const response = {
      subscription: subscription ? {
        tier: subscription.subscription_tier || 'free',
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at
      } : {
        tier: 'free',
        status: 'inactive',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        createdAt: null,
        updatedAt: null
      },
      usageStats: usageStats ? {
        requestsToday: usageStats.requests_today || 0,
        requestsThisMonth: usageStats.requests_this_month || 0,
        lastRequestAt: usageStats.last_request_at
      } : {
        requestsToday: 0,
        requestsThisMonth: 0,
        lastRequestAt: null
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in subscription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
