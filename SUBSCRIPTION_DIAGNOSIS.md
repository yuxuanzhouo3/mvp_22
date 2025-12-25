# 🔍 订阅状态诊断指南

## 🚨 问题：购买了套餐还是显示免费版

如果您已经支付但仍然显示免费版，请按以下步骤排查：

## 📋 诊断步骤

### 1. 检查个人资料页面的测试功能

1. **访问个人资料页面**: http://localhost:3000/profile
2. **查找测试区域**: 页面底部找到"订阅管理 (测试功能)"部分
3. **测试订阅设置**:
   - 点击"基础版"按钮
   - 刷新页面查看等级是否更新
   - 访问 http://localhost:3000/generate 验证模型权限

**如果测试功能正常** → 说明前端代码没问题，问题在支付流程

### 2. 检查数据库连接

运行以下命令检查数据库状态：

```bash
# 检查配置
node check-config.js

# 检查数据库表
node test-supabase.js
```

如果显示"❌ 未设置"，说明环境变量配置有问题。

### 3. 检查支付流程

1. **查看支付记录**:
   - 访问 http://localhost:3000/payment
   - 点击"历史"标签查看支付记录

2. **检查支付状态**:
   - 支付记录的状态应该是"completed"
   - 如果是"pending"，说明支付未完成

### 4. 检查 Webhook 处理

如果支付成功但订阅未更新，可能是 webhook 问题：

1. **检查 Stripe webhook 配置**:
   - 登录 Stripe Dashboard
   - 进入 Developers → Webhooks
   - 确认 webhook URL 正确：`https://yourdomain.com/api/payment/webhook/stripe`

2. **检查服务器日志**:
   - 查看开发服务器的控制台输出
   - 查找 webhook 相关的错误信息

### 5. 检查数据库表

如果 webhook 正常但数据未更新，可能是数据库表问题：

1. **确认表已创建**:
   ```sql
   -- 在 Supabase SQL Editor 中运行
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'user_subscriptions';
   ```

2. **检查数据**:
   ```sql
   -- 查看您的订阅记录（替换 YOUR_USER_ID）
   SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

## 🔧 解决方案

### 方案1：使用测试功能验证

最简单的验证方法：
1. 在个人资料页面使用测试按钮设置订阅
2. 如果能正常工作，说明代码没问题
3. 问题在真实的支付 webhook 处理

### 方案2：手动设置订阅（临时）

如果您知道自己的用户ID，可以使用这个脚本：

```bash
# 检查您的订阅状态（替换为您的用户ID）
node check-user-subscription.js YOUR_USER_ID
```

### 方案3：重新配置环境变量

确保 `.env.local` 文件包含：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Stripe 配置
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 方案4：重建数据库表

在 Supabase SQL Editor 中重新运行：

```sql
-- 删除旧表（如果存在）
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS user_usage_stats;

-- 重新创建表
-- 复制 supabase-subscription-schema.sql 的完整内容
```

## 🎯 常见问题

### Q: 为什么测试功能正常但真实支付不行？
A: 测试功能直接修改数据库，真实支付依赖 webhook 回调处理。

### Q: Webhook 显示成功但订阅没更新？
A: 检查 webhook 处理代码中的数据库操作是否有错误。

### Q: 支付成功了但状态一直是 pending？
A: Webhook 没有正确触发，或 webhook 处理器有问题。

### Q: 数据库连接正常但查询失败？
A: 检查 RLS 策略是否允许用户查看自己的订阅数据。

## 🚀 快速修复

如果您想快速验证功能，可以：

1. **使用测试功能**设置订阅等级
2. **检查是否生效**
3. **如果生效**，说明代码正常，问题在支付 webhook
4. **如果不生效**，说明环境变量或数据库配置有问题

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供：

1. 浏览器控制台的错误信息
2. 服务器控制台的日志
3. 数据库查询结果
4. 支付平台的 webhook 事件日志

这样我们就能更准确地定位问题！
















