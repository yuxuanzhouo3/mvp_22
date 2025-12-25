/**
 * 测试Stripe webhook处理
 */

const { createClient } = require('@supabase/supabase-js');

// 模拟Stripe checkout.session.completed webhook数据
const mockStripeWebhook = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_session_id',
      object: 'checkout.session',
      amount_total: 9900, // $99.00 in cents
      currency: 'usd',
      metadata: {
        userId: 'test-user-id', // 请替换为实际的用户ID
        days: '365' // 一年期
      },
      payment_status: 'paid'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

async function testStripeWebhook() {
  console.log('🧪 测试Stripe webhook处理...\n');

  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ 缺少Supabase环境变量');
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. 创建测试用户（如果不存在）
    console.log('👤 创建测试用户...');
    const testUserId = 'test-user-' + Date.now();

    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(testUserId);
    if (!existingUser.user) {
      // 创建用户
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        user_metadata: { name: 'Test User' }
      });

      if (createError) {
        console.log('❌ 创建测试用户失败:', createError.message);
        return;
      }

      console.log('✅ 测试用户创建成功:', newUser.user.id);
      // 使用实际的用户ID
      mockStripeWebhook.data.object.metadata.userId = newUser.user.id;
    } else {
      mockStripeWebhook.data.object.metadata.userId = testUserId;
    }

    // 2. 模拟webhook处理逻辑
    console.log('🔄 模拟webhook处理...');
    const session = mockStripeWebhook.data.object;
    const userId = session.metadata?.userId;
    const days = session.metadata?.days ? parseInt(session.metadata.days, 10) : 30;
    const amount = (session.amount_total || 0) / 100; // 转换为美元
    const currency = (session.currency || "USD").toUpperCase();
    const transactionId = session.id;

    console.log(`📊 处理数据:
  - 用户ID: ${userId}
  - 金额: $${amount}
  - 天数: ${days}
  - 交易ID: ${transactionId}
`);

    // 3. 根据金额确定订阅等级
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

    console.log(`🎯 确定订阅等级: ${subscriptionTier}`);

    // 4. 更新订阅状态
    const now = new Date();
    const newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    console.log('💾 更新订阅状态...');

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
      const { data, error } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          subscription_tier: subscriptionTier,
          current_period_end: newPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId);

      updateResult = { data, error };
    } else {
      // 创建新订阅
      const { data, error } = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          subscription_tier: subscriptionTier,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
          stripe_subscription_id: transactionId,
        });

      updateResult = { data, error };
    }

    if (updateResult.error) {
      console.log('❌ 订阅更新失败:', updateResult.error.message);
      return;
    }

    console.log('✅ 订阅更新成功');

    // 5. 验证结果
    console.log('🔍 验证更新结果...');
    const { data: verifySubscription, error: verifyError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_tier, current_period_end, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (verifyError) {
      console.log('❌ 验证失败:', verifyError.message);
      return;
    }

    if (verifySubscription.subscription_tier === subscriptionTier) {
      console.log('🎉 webhook处理测试成功！');
      console.log(`   订阅等级: ${verifySubscription.subscription_tier}`);
      console.log(`   到期时间: ${verifySubscription.current_period_end}`);
      console.log(`   状态: ${verifySubscription.status}`);
    } else {
      console.log('❌ 订阅等级更新验证失败');
      console.log(`   期望: ${subscriptionTier}`);
      console.log(`   实际: ${verifySubscription.subscription_tier}`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 加载环境变量
  require('dotenv').config({ path: '.env.local' });

  testStripeWebhook().catch(console.error);
}

module.exports = { testStripeWebhook };
















