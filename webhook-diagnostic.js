/**
 * Webhook 配置诊断工具
 * 检查 Stripe 和 PayPal webhook 配置
 */

const https = require('https');

async function checkWebhookConfiguration() {
  console.log('🔍 Webhook 配置诊断工具\n');

  // 检查环境变量
  console.log('📋 检查环境变量配置:');
  const requiredEnvVars = [
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_WEBHOOK_ID',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.log('❌ 缺少环境变量:', missingVars.join(', '));
    console.log('请在 .env.local 中配置这些变量\n');
  } else {
    console.log('✅ 所有必要环境变量已配置\n');
  }

  // 检查应用URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('🌐 应用URL:', appUrl);

  // 期望的webhook URLs
  const stripeWebhookUrl = `${appUrl}/api/payment/webhook/stripe`;
  const paypalWebhookUrl = `${appUrl}/api/payment/webhook/paypal`;

  console.log('🔗 期望的Webhook URLs:');
  console.log('- Stripe:', stripeWebhookUrl);
  console.log('- PayPal:', paypalWebhookUrl);
  console.log('');

  // 检查本地服务器是否运行
  console.log('🖥️  检查本地服务器状态...');
  try {
    const response = await fetch(`${appUrl}/api/test-env`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 本地服务器运行正常');
      console.log('📊 配置状态:', data);
    } else {
      console.log('❌ 本地服务器响应异常');
    }
  } catch (error) {
    console.log('❌ 无法连接到本地服务器:', error.message);
    console.log('请确保运行: npm run dev');
  }
  console.log('');

  // 检查Stripe webhook secret格式
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (stripeSecret) {
    if (stripeSecret.startsWith('whsec_')) {
      console.log('✅ Stripe webhook secret 格式正确');
    } else {
      console.log('❌ Stripe webhook secret 格式错误，应该以 whsec_ 开头');
    }
  }

  // 检查PayPal webhook ID格式
  const paypalId = process.env.PAYPAL_WEBHOOK_ID;
  if (paypalId) {
    if (paypalId.length > 10) {
      console.log('✅ PayPal webhook ID 格式正确');
    } else {
      console.log('❌ PayPal webhook ID 格式错误');
    }
  }

  console.log('\n📝 配置检查完成!');
  console.log('请按照以下步骤验证配置:');
  console.log('1. 登录 Stripe Dashboard → Developers → Webhooks');
  console.log('2. 确认 endpoint URL 为:', stripeWebhookUrl);
  console.log('3. 确认监听事件包含: checkout.session.completed');
  console.log('4. 登录 PayPal Developer Dashboard → Webhooks');
  console.log('5. 确认 webhook URL 为:', paypalWebhookUrl);
  console.log('6. 确认监听事件包含: PAYMENT.CAPTURE.COMPLETED');
}

// 如果直接运行此脚本
if (require.main === module) {
  // 加载环境变量
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.log('⚠️  无法加载 .env.local 文件，请手动检查环境变量');
  }

  checkWebhookConfiguration().catch(console.error);
}

module.exports = { checkWebhookConfiguration };
