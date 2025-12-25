# 支付功能测试指南

本文档提供 PayPal 和 Stripe 支付功能的完整测试步骤。

## 📋 测试前准备

### 1. 确保数据库 Schema 已创建

在 Supabase Dashboard 的 SQL Editor 中运行 `supabase-payment-schema.sql`：

```sql
-- 验证表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'subscriptions', 'webhook_events');
```

### 2. 配置环境变量

在 `.env.local` 文件中配置支付相关的环境变量：

```env
# Stripe 配置（测试环境）
STRIPE_SECRET_KEY=sk_test_你的真实密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_你的真实密钥
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥（可选）

# PayPal 配置（测试环境）
PAYPAL_CLIENT_ID=你的PayPal_Client_ID
PAYPAL_CLIENT_SECRET=你的PayPal_Client_Secret
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=你的PayPal_Webhook_ID（可选）
PAYPAL_SKIP_SIGNATURE_VERIFICATION=true  # 开发环境可以设为 true

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C），然后重新启动
pnpm dev
```

## 🧪 测试步骤

### 步骤 1: 访问支付页面

1. 启动开发服务器：`pnpm dev`
2. 访问 `http://localhost:3000`
3. 登录或注册账户
4. 访问支付页面：`http://localhost:3000/payment`

### 步骤 2: 选择订阅计划

1. 在支付页面的 **Plans** 标签页
2. 选择一个计划：
   - **Pro Monthly** ($9.99/月)
   - **Pro Yearly** ($99.99/年) - 推荐，节省 20%
3. 点击 **Choose Plan** 按钮

### 步骤 3: 选择支付方式

1. 自动跳转到 **Payment** 标签页
2. 选择支付方式：
   - **Stripe** - 信用卡支付
   - **PayPal** - PayPal 账户支付
3. 点击 **Pay Now** 按钮

## 💳 Stripe 测试

### 获取测试 API Key

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 登录账户（如果没有，先注册）
3. 进入 **Developers** → **API keys**
4. 确保在 **Test mode**（测试模式）
5. 复制：
   - **Secret key** (sk_test_...)
   - **Publishable key** (pk_test_...)

### Stripe 测试卡号

使用以下测试卡号进行支付：

| 卡号 | 用途 |
|------|------|
| `4242 4242 4242 4242` | 成功支付 |
| `4000 0000 0000 0002` | 支付被拒绝 |
| `4000 0000 0000 9995` | 需要 3D Secure 验证 |

**通用测试信息：**
- **过期日期**：任意未来日期（如 12/25）
- **CVC**：任意 3 位数字（如 123）
- **邮编**：任意邮编（如 12345）

### Stripe 测试流程

1. 选择 **Stripe** 支付方式
2. 点击 **Pay Now**
3. 跳转到 Stripe Checkout 页面
4. 输入测试卡号：`4242 4242 4242 4242`
5. 输入任意未来日期和 CVC
6. 点击 **Pay**
7. 支付成功后自动跳转到 `/payment/success`
8. 系统自动确认支付并更新订阅状态

### 验证 Stripe 支付

1. **检查数据库**：
   ```sql
   -- 查看支付记录
   SELECT * FROM public.payments 
   WHERE payment_method = 'stripe' 
   ORDER BY created_at DESC LIMIT 5;

   -- 查看订阅记录
   SELECT * FROM public.subscriptions 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **检查 Stripe Dashboard**：
   - 进入 **Payments** 页面
   - 应该能看到测试支付记录
   - 状态应该是 **Succeeded**

## 💰 PayPal 测试

### 获取测试凭证

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 登录账户
3. 进入 **Dashboard** → **My Apps & Credentials**
4. 选择 **Sandbox** 环境
5. 创建新应用或使用默认应用
6. 复制：
   - **Client ID**
   - **Client Secret**

### PayPal 测试账户

PayPal Sandbox 会自动创建测试账户：

1. 在 PayPal Developer Dashboard 中
2. 进入 **Accounts** → **Sandbox** → **Accounts**
3. 可以看到：
   - **Personal** 账户（用于买家测试）
   - **Business** 账户（用于商家测试）

**测试账户信息：**
- PayPal 会自动创建测试账户
- 使用 PayPal Sandbox 登录页面登录
- 密码在账户详情中查看

### PayPal 测试流程

1. 选择 **PayPal** 支付方式
2. 点击 **Pay Now**
3. 跳转到 PayPal 登录页面
4. 使用 PayPal Sandbox 测试账户登录：
   - 邮箱：测试账户的邮箱
   - 密码：测试账户的密码
5. 确认支付
6. 支付成功后自动跳转到 `/payment/success`
7. 系统自动确认支付并更新订阅状态

### 验证 PayPal 支付

1. **检查数据库**：
   ```sql
   -- 查看支付记录
   SELECT * FROM public.payments 
   WHERE payment_method = 'paypal' 
   ORDER BY created_at DESC LIMIT 5;

   -- 查看订阅记录
   SELECT * FROM public.subscriptions 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **检查 PayPal Dashboard**：
   - 进入 **Dashboard** → **Sandbox** → **Transactions**
   - 应该能看到测试支付记录

## 🔍 测试检查清单

### 功能测试

- [ ] 可以访问 `/payment` 页面
- [ ] 可以选择订阅计划（月付/年付）
- [ ] 可以选择支付方式（Stripe/PayPal）
- [ ] 可以跳转到支付提供商页面
- [ ] 支付成功后可以返回应用
- [ ] 支付记录保存到数据库
- [ ] 订阅状态正确更新
- [ ] 会员到期时间正确计算

### 数据库验证

```sql
-- 1. 检查支付记录
SELECT 
  id,
  user_id,
  amount,
  currency,
  status,
  payment_method,
  transaction_id,
  created_at
FROM public.payments
ORDER BY created_at DESC
LIMIT 10;

-- 2. 检查订阅记录
SELECT 
  id,
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  provider_subscription_id,
  created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查 webhook 事件（如果有）
SELECT 
  id,
  provider,
  event_type,
  processed,
  created_at
FROM public.webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

### 前端验证

1. **支付页面** (`/payment`)：
   - [ ] 显示订阅计划
   - [ ] 显示支付表单
   - [ ] 显示账单历史

2. **支付成功页面** (`/payment/success`)：
   - [ ] 显示成功消息
   - [ ] 自动跳转到支付页面

3. **支付取消页面** (`/payment/cancel`)：
   - [ ] 显示取消消息
   - [ ] 可以返回支付页面

## 🐛 常见问题排查

### 问题 1: "Stripe API Key is not configured"

**原因**：环境变量未设置或包含占位符

**解决方案**：
1. 检查 `.env.local` 文件
2. 确保 `STRIPE_SECRET_KEY` 是真实的 API Key（不包含 `**`）
3. 重启开发服务器

### 问题 2: "PayPal credentials are not configured"

**原因**：PayPal 环境变量未设置

**解决方案**：
1. 检查 `.env.local` 文件
2. 确保 `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET` 已设置
3. 重启开发服务器

### 问题 3: 支付后订阅未更新

**原因**：Webhook 未配置或未正确处理

**解决方案**：
1. 检查 webhook 是否配置
2. 查看服务器日志中的 webhook 处理记录
3. 手动触发支付确认（访问 `/payment/success` 页面）

### 问题 4: 数据库表不存在

**原因**：未运行数据库 Schema

**解决方案**：
1. 在 Supabase Dashboard 运行 `supabase-payment-schema.sql`
2. 验证表是否创建成功

### 问题 5: 支付页面显示错误

**原因**：用户未登录或认证失败

**解决方案**：
1. 确保已登录
2. 检查浏览器控制台错误
3. 检查网络请求状态

## 📊 测试数据清理

测试完成后，可以清理测试数据：

```sql
-- 删除测试支付记录（谨慎使用）
DELETE FROM public.payments 
WHERE user_id = '你的用户ID';

-- 删除测试订阅记录（谨慎使用）
DELETE FROM public.subscriptions 
WHERE user_id = '你的用户ID';

-- 删除 webhook 事件记录（谨慎使用）
DELETE FROM public.webhook_events;
```

## 🎯 完整测试流程示例

### 测试场景 1: Stripe 月付

1. 访问 `http://localhost:3000/payment`
2. 选择 **Pro Monthly** 计划
3. 选择 **Stripe** 支付方式
4. 使用测试卡号 `4242 4242 4242 4242` 完成支付
5. 验证：
   - 支付记录状态为 `completed`
   - 订阅记录 `current_period_end` 为 30 天后
   - 用户会员状态已更新

### 测试场景 2: PayPal 年付

1. 访问 `http://localhost:3000/payment`
2. 选择 **Pro Yearly** 计划
3. 选择 **PayPal** 支付方式
4. 使用 PayPal Sandbox 账户完成支付
5. 验证：
   - 支付记录状态为 `completed`
   - 订阅记录 `current_period_end` 为 365 天后
   - 用户会员状态已更新

### 测试场景 3: 支付历史

1. 完成几次测试支付
2. 访问 `/payment` 页面的 **History** 标签页
3. 验证：
   - 显示所有支付记录
   - 金额、日期、状态正确显示
   - 支付方式正确显示

## 📝 测试日志

测试时注意观察以下日志：

1. **服务器日志**：
   - 支付创建日志
   - Webhook 处理日志
   - 数据库操作日志

2. **浏览器控制台**：
   - API 请求状态
   - 错误信息
   - 网络请求详情

3. **数据库日志**：
   - 支付记录创建
   - 订阅状态更新
   - Webhook 事件处理

## ✅ 测试完成标准

支付功能测试通过的标准：

1. ✅ 可以成功创建支付订单
2. ✅ 可以跳转到支付提供商页面
3. ✅ 支付成功后可以返回应用
4. ✅ 支付记录正确保存到数据库
5. ✅ 订阅状态正确更新
6. ✅ 会员到期时间正确计算
7. ✅ 支付历史正确显示
8. ✅ Webhook 正确处理支付事件（如果配置）

## 🔗 相关资源

- [Stripe 测试卡号](https://stripe.com/docs/testing)
- [PayPal Sandbox 测试](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [支付功能配置文档](./PAYMENT_SETUP.md)
























