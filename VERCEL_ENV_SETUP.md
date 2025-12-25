# Vercel 环境变量配置指南

## 问题原因
Vercel 部署时前端无法读取环境变量的原因：

1. **Next.js 配置问题**：`output: 'standalone'` 模式不适用于 Vercel
2. **环境变量未配置**：Vercel 需要在控制台中单独配置环境变量
3. **API 路由缓存**：环境变量 API 可能被缓存

## 解决方案

### 1. 移除 Standalone 输出模式
已修复：`next.config.mjs` 中移除了 `output: 'standalone'` 配置。

### 2. 在 Vercel 控制台配置环境变量

在 Vercel 项目设置中配置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. 环境变量配置步骤

1. 进入 Vercel 控制台
2. 选择你的项目
3. 点击 "Settings" → "Environment Variables"
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 项目 URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 发布密钥 | Production |
| `NEXT_PUBLIC_APP_URL` | Vercel 应用 URL | Production |

### 4. 重新部署

配置环境变量后，需要重新部署应用：

```bash
# 提交更改到 Git
git add .
git commit -m "Fix Vercel environment variables"
git push
```

### 5. 验证环境变量

部署完成后，可以通过以下方式验证：

1. 打开浏览器开发者工具
2. 访问 `/api/env` 路由
3. 检查返回的环境变量是否正确

### 6. 常见问题

**Q: 仍然显示 "Environment variables not initialized"**
A: 确保在 Vercel 控制台中正确配置了所有环境变量

**Q: API 返回空值**
A: 检查 Vercel 控制台中的环境变量名称和值是否正确

**Q: 401 认证错误**
A: 通常是因为 Supabase 环境变量未正确配置导致的

## 环境变量说明

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名访问密钥（公开的）
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe 发布密钥（公开的）
- `NEXT_PUBLIC_APP_URL`: 应用的基础 URL

注意：不要在客户端代码中直接使用 `process.env`，而是通过 `/api/env` 路由获取。
