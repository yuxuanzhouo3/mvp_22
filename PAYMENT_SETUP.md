# 支付功能集成指南

本文档说明如何配置和使用 PayPal 和 Stripe 支付功能（国际版）。

## 功能概述

本项目已集成 PayPal 和 Stripe 支付功能，支持：
- 一次性支付（非订阅模式）
- 月付和年付两种计费周期
- Webhook 自动处理支付完成事件
- 支付历史记录查询

## 数据库设置

### 1. 运行数据库 Schema

在 Supabase Dashboard 的 SQL Editor 中运行 `supabase-payment-schema.sql` 文件，创建以下表：
- `payments` - 支付记录表
- `subscriptions` - 订阅信息表
- `webhook_events` - Webhook 事件记录表（用于幂等性）

### 2. 验证表创建

确保以下表已创建：
```sql
SELECT * FROM public.payments LIMIT 1;
SELECT * FROM public.subscriptions LIMIT 1;
SELECT * FROM public.webhook_events LIMIT 1;
```

## PayPal 配置

### 1. 创建 PayPal 应用

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 登录并创建新应用
3. 选择应用类型：**REST API apps**
4. 选择环境：**Sandbox**（测试）或 **Live**（生产）

### 2. 获取凭证

- **Client ID** - 用于创建支付订单
- **Client Secret** - 用于服务器端 API 调用

### 3. 配置 Webhook

1. 在 PayPal Developer Dashboard 中进入 **Webhooks** 页面
2. 创建新的 Webhook
3. Webhook URL: `https://yourdomain.com/api/payment/webhook/paypal`
4. 订阅事件：
   - `PAYMENT.CAPTURE.COMPLETED` - 支付完成
   - `CHECKOUT.ORDER.APPROVED` - 订单批准
5. 复制 **Webhook ID**

### 4. 设置环境变量

在 `.env.local` 中添加：
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # 或 production
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_SKIP_SIGNATURE_VERIFICATION=false  # 开发环境可设为 true
```

## Stripe 配置

### 1. 创建 Stripe 账户

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 注册/登录账户
3. 进入 **Developers** → **API keys**

### 2. 获取 API 密钥

- **Publishable key** (pk_test_...) - 用于前端
- **Secret key** (sk_test_...) - 用于服务器端

### 3. 配置 Webhook

1. 在 Stripe Dashboard 中进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/payment/webhook/stripe`
4. 选择事件：
   - `checkout.session.completed` - 支付完成
5. 复制 **Signing secret** (whsec_...)

### 4. 设置环境变量

在 `.env.local` 中添加：
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 应用配置

### 1. 设置应用 URL

在 `.env.local` 中设置：
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 开发环境
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # 生产环境
```

### 2. 重启开发服务器

```bash
pnpm dev
```

## 使用流程

### 用户支付流程

1. 用户访问 `/payment` 页面
2. 选择订阅计划（月付或年付）
3. 选择支付方式（PayPal 或 Stripe）
4. 跳转到支付提供商页面完成支付
5. 支付成功后返回 `/payment/success`
6. 系统自动处理支付并更新订阅状态

### Webhook 处理

- PayPal 和 Stripe 的 webhook 会自动处理支付完成事件
- Webhook 会更新订阅状态和会员到期时间
- 支持幂等性处理，避免重复处理相同事件

## API 端点

### 创建支付
```
POST /api/payment/onetime/create
Authorization: Bearer <token>
Body: {
  "method": "paypal" | "stripe",
  "billingCycle": "monthly" | "yearly"
}
```

### 确认支付
```
GET /api/payment/onetime/confirm?session_id=<stripe_session_id>
GET /api/payment/onetime/confirm?token=<paypal_order_id>
Authorization: Bearer <token>
```

### 支付历史
```
GET /api/payment/history?page=1&pageSize=50
Authorization: Bearer <token>
```

### Webhook 端点
```
POST /api/payment/webhook/paypal
POST /api/payment/webhook/stripe
```

## 定价配置

定价在 `lib/payment/payment-config.ts` 中定义：
- USD: 月付 $9.99，年付 $99.99
- CNY: 月付 ¥0.01，年付 ¥0.01（测试用）

## 测试

### PayPal 测试

1. 使用 PayPal Sandbox 账户测试
2. 测试账户：在 PayPal Developer Dashboard 中创建
3. 测试支付流程：使用测试账户完成支付

### Stripe 测试

1. 使用 Stripe 测试模式
2. 测试卡号：`4242 4242 4242 4242`
3. 任意未来日期和 CVC
4. 使用 Stripe Dashboard 查看测试支付

## 故障排除

### Webhook 未收到

1. 检查 webhook URL 是否正确配置
2. 确认服务器可以接收外部请求
3. 检查 webhook 签名验证设置
4. 查看服务器日志

### 支付未更新订阅

1. 检查 webhook 是否成功处理
2. 查看 `webhook_events` 表
3. 检查 `payments` 表状态
4. 验证 `subscriptions` 表更新

## 安全注意事项

1. **永远不要**在前端暴露 Secret Key
2. 生产环境必须启用 webhook 签名验证
3. 使用 HTTPS 保护 webhook 端点
4. 定期检查支付记录和订阅状态

## 参考文档

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
























