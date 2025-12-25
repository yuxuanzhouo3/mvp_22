# 🔧 Stripe API Key 快速修复指南

## ⚠️ 当前错误

```
This API call cannot be made with a publishable API key. 
Please use a secret API key.
```

## 🔍 问题原因

你的 `.env.local` 文件中 Stripe 的 **Secret Key** 和 **Publishable Key 位置反了**！

## ✅ 立即修复（3步）

### 步骤 1: 打开 `.env.local` 文件

找到这两行：
```env
STRIPE_SECRET_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_test_...
```

### 步骤 2: 交换它们的值

**修改为：**
```env
STRIPE_SECRET_KEY=sk_test_...  # 必须是 sk_test_ 或 sk_live_ 开头
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # 必须是 pk_test_ 或 pk_live_ 开头
```

### 步骤 3: 重启服务器

```bash
# 1. 停止当前服务器（按 Ctrl+C）
# 2. 重新启动
pnpm dev
```

## 📝 如何区分两种 Key

| 类型 | 前缀 | 用途 | 位置 |
|------|------|------|------|
| **Secret Key** | `sk_test_` 或 `sk_live_` | 服务器端 API 调用 | `.env.local` 中的 `STRIPE_SECRET_KEY` |
| **Publishable Key** | `pk_test_` 或 `pk_live_` | 客户端（浏览器） | `.env.local` 中的 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## 🔍 验证修复

修复后，查看服务器启动日志，应该看到：
```
✅ Stripe initialized successfully with Secret Key
```

而不是：
```
❌ ERROR: STRIPE_SECRET_KEY contains a Publishable Key instead of a Secret Key!
```

## 📍 在 Stripe Dashboard 中查找

1. 访问 https://dashboard.stripe.com/apikeys
2. 确保在 **Test mode**（测试模式）
3. 找到：
   - **Secret key** → 复制到 `STRIPE_SECRET_KEY`
   - **Publishable key** → 复制到 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## ⚡ 快速检查命令

运行以下命令检查当前配置：

```powershell
# PowerShell
Get-Content .env.local | Select-String -Pattern "STRIPE"
```

应该看到：
- `STRIPE_SECRET_KEY=sk_test_...` ✅
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` ✅

如果看到相反的情况，就需要交换它们！
























