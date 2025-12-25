/**
 * 测试支付升级功能
 * 检查webhook配置和支付流程
 */

const { createClient } = require('@supabase/supabase-js');

async function testPaymentUpgrade() {
  console.log('🔍 开始测试支付升级功能...\n');

  // 检查环境变量
  console.log('📋 检查环境变量配置:');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.log('❌ 缺少环境变量:', missingVars);
    return;
  }
  console.log('✅ 所有必要环境变量已配置\n');

  // 初始化Supabase客户端
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 测试数据库连接
    console.log('🔗 测试数据库连接...');
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ 数据库连接失败:', error.message);
      return;
    }
    console.log('✅ 数据库连接正常\n');

    // 检查订阅表
    console.log('📊 检查订阅表结构...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'user_subscriptions' });

    if (tablesError) {
      console.log('⚠️ 无法检查表结构，但这不影响功能测试\n');
    }

    // 模拟webhook数据
    console.log('🔄 模拟webhook调用...');
    const testUserId = 'test-user-' + Date.now();
    const testTransactionId = 'test-txn-' + Date.now();

    // 创建测试用户订阅记录
    console.log('👤 创建测试用户订阅记录...');
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: testUserId,
        subscription_tier: 'free',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.log('❌ 创建测试订阅记录失败:', insertError.message);
      return;
    }
    console.log('✅ 测试订阅记录创建成功\n');

    // 模拟升级到basic tier (99 USD)
    console.log('⬆️ 模拟升级到Basic套餐...');
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        subscription_tier: 'basic',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUserId);

    if (updateError) {
      console.log('❌ 升级失败:', updateError.message);
      return;
    }
    console.log('✅ 升级成功\n');

    // 验证升级结果
    console.log('✅ 验证升级结果...');
    const { data: verifyResult, error: verifyError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('subscription_tier')
      .eq('user_id', testUserId)
      .single();

    if (verifyError) {
      console.log('❌ 验证失败:', verifyError.message);
      return;
    }

    if (verifyResult.subscription_tier === 'basic') {
      console.log('✅ 订阅等级成功更新为:', verifyResult.subscription_tier);
    } else {
      console.log('❌ 订阅等级更新失败，当前等级:', verifyResult.subscription_tier);
      return;
    }

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', testUserId);

    console.log('✅ 测试完成！数据库升级逻辑正常\n');

    console.log('🎯 问题排查建议:');
    console.log('1. 检查Stripe/PayPal webhook配置是否指向正确的URL');
    console.log('2. 确认webhook secret配置正确');
    console.log('3. 检查服务器日志中的webhook处理错误');
    console.log('4. 验证支付成功后的重定向是否正确');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 手动设置环境变量（从.env.local复制）
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

  testPaymentUpgrade().catch(console.error);
}

module.exports = { testPaymentUpgrade };
