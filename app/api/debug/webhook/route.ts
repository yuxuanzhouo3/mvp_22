/**
 * Webhook调试端点
 * GET /api/debug/webhook - 显示webhook状态
 * POST /api/debug/webhook - 手动触发webhook处理
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // 检查环境变量
    const envStatus = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ 已配置' : '❌ 未配置',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ 已配置' : '❌ 未配置',
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? '✅ 已配置' : '❌ 未配置',
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? '✅ 已配置' : '❌ 未配置',
      PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID ? '✅ 已配置' : '❌ 未配置',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已配置' : '❌ 未配置'
    };

    // 检查数据库连接
    let dbStatus = '❌ 未连接';
    try {
      const { data, error } = await supabaseAdmin
        .from('user_subscriptions')
        .select('count')
        .limit(1);

      if (!error) {
        dbStatus = '✅ 已连接';
      }
    } catch (error) {
      dbStatus = '❌ 连接失败';
    }

    // Webhook URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrls = {
      stripe: `${baseUrl}/api/payment/webhook/stripe`,
      paypal: `${baseUrl}/api/payment/webhook/paypal`
    };

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        baseUrl: baseUrl
      },
      configuration: envStatus,
      database: dbStatus,
      webhookUrls: webhookUrls,
      instructions: {
        stripe: [
          '1. 登录 https://dashboard.stripe.com/',
          '2. 进入 Webhooks 页面',
          '3. 添加 endpoint: ' + webhookUrls.stripe,
          '4. 选择事件: checkout.session.completed',
          '5. 复制 Signing secret 到 STRIPE_WEBHOOK_SECRET'
        ],
        paypal: [
          '1. 登录 PayPal 开发者控制台',
          '2. 进入应用设置',
          '3. 添加 webhook: ' + webhookUrls.paypal,
          '4. 选择事件: PAYMENT.CAPTURE.COMPLETED',
          '5. 复制 Webhook ID 到 PAYPAL_WEBHOOK_ID'
        ]
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, userId, amount, days = 30 } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, amount' },
        { status: 400 }
      );
    }

    // 模拟webhook数据
    let mockData;
    if (provider === 'stripe') {
      mockData = {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        amount_total: amount * 100, // 转换为分
        currency: 'usd',
        metadata: {
          userId: userId,
          days: days.toString()
        },
        payment_status: 'paid'
      };
    } else if (provider === 'paypal') {
      mockData = {
        id: 'PAY-' + Date.now(),
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: 'CAPTURE-' + Date.now(),
              amount: {
                value: amount.toString(),
                currency_code: 'USD'
              }
            }]
          }
        }]
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Use "stripe" or "paypal"' },
        { status: 400 }
      );
    }

    // 手动处理订阅更新
    const now = new Date();
    const newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // 根据金额确定订阅等级
    let subscriptionTier;
    if (amount >= 999) {
      subscriptionTier = 'premium';
    } else if (amount >= 299) {
      subscriptionTier = 'pro';
    } else if (amount >= 99) {
      subscriptionTier = 'basic';
    } else {
      subscriptionTier = 'free';
    }

    // 检查是否已有活跃订阅
    const { data: existingSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    let updateResult;
    if (existingSubscription) {
      // 更新现有订阅
      updateResult = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          subscription_tier: subscriptionTier,
          current_period_end: newPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId);
    } else {
      // 创建新订阅
      updateResult = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          subscription_tier: subscriptionTier,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
          stripe_subscription_id: provider === 'stripe' ? mockData.id : null,
        });
    }

    if (updateResult.error) {
      return NextResponse.json(
        { error: 'Failed to update subscription: ' + updateResult.error.message },
        { status: 500 }
      );
    }

    // 验证结果
    const { data: verifySubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_tier, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${subscriptionTier} tier`,
      subscription: {
        tier: verifySubscription?.subscription_tier,
        periodEnd: verifySubscription?.current_period_end,
        amount: amount,
        days: days,
        provider: provider
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
















