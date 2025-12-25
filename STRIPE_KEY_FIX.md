# ⚠️ Stripe API Key 配置错误修复

## 问题

你的 `.env.local` 文件中 Stripe 的 Secret Key 和 Publishable Key **位置反了**！

当前配置（错误）：
```env
STRIPE_SECRET_KEY=pk_test_...  # ❌ 这是 Publishable Key，不是 Secret Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_test_...  # ❌ 这是 Secret Key，不是 Publishable Key
```

## 解决方案

**交换这两个值**，正确的配置应该是：

```env
# Secret Key（服务器端使用，以 sk_test_ 或 sk_live_ 开头）
STRIPE_SECRET_KEY=sk_test_51SVunpPTyQ0X8hUgZ92WZD5HnMXwRJGSqyZbHz1YafO7poyTUpglhXQnc0idqp5PzQwPOFsV23QiML6b0EQdj4na00T3tGD6cV

# Publishable Key（客户端使用，以 pk_test_ 或 pk_live_ 开头）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SVunpPTyQ0X8hUgh2rTR7vxHOz3tPhFWU9Fu1iFgIok68Fjm3YG3XUTv2Py3csv4st0cRN06GcAk2TeQxZGrB9H00E7N863w5
```

## 如何区分

- **Secret Key** (`sk_test_...` 或 `sk_live_...`)：
  - 用于服务器端 API 调用
  - 可以创建支付会话、处理 webhook 等
  - **永远不要**暴露给客户端

- **Publishable Key** (`pk_test_...` 或 `pk_live_...`)：
  - 用于客户端（浏览器）
  - 可以安全地暴露在代码中
  - 用于初始化 Stripe.js

## 修复步骤

1. 打开 `.env.local` 文件
2. 找到这两行：
   ```env
   STRIPE_SECRET_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_test_...
   ```
3. **交换它们的值**：
   ```env
   STRIPE_SECRET_KEY=sk_test_...  # 原来在 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 的值
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # 原来在 STRIPE_SECRET_KEY 的值
   ```
4. 保存文件
5. **重启开发服务器**：
   ```bash
   # 停止服务器（Ctrl+C）
   pnpm dev
   ```

## 验证

修复后，再次尝试创建支付订单，应该不会再出现 "publishable API key" 的错误。
























