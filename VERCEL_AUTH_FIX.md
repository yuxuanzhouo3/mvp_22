# Vercel 认证问题修复指南

## 🚨 问题描述

在 Vercel 部署后出现以下问题：
- 本地可以正常登录，但线上只能使用测试账号
- 各种 API 调用返回 401 错误
- 支付功能报错 "Invalid session"
- GitHub OAuth 回调失败

## 🔍 根本原因

1. **环境变量未正确配置**：Vercel 上的环境变量缺失或错误
2. **Supabase 配置问题**：Site URL 和回调 URL 不匹配
3. **GitHub OAuth 配置**：回调 URL 仍然指向 localhost
4. **域名变化**：Vercel 域名与本地开发环境不同

## 🛠️ 修复步骤

### 步骤 1: 配置 Vercel 环境变量

在 Vercel 项目控制台中设置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 步骤 2: 更新 Supabase 项目配置

1. 进入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目 → Settings → Authentication
3. 在 "Site URL" 中设置：
   ```
   https://your-app.vercel.app
   ```
4. 在 "Redirect URLs" 中添加：
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/api/github/callback
   ```

### 步骤 3: 更新 GitHub OAuth 配置

1. 进入 [GitHub Settings](https://github.com/settings/developers)
2. 选择你的 OAuth App
3. 更新 "Homepage URL"：
   ```
   https://your-app.vercel.app
   ```
4. 更新 "Authorization callback URL"：
   ```
   https://your-app.vercel.app/api/github/callback
   ```

### 步骤 4: 重新部署

```bash
git add .
git commit -m "Fix Vercel authentication configuration"
git push
```

## 🔧 诊断工具

项目中添加了诊断组件来帮助调试：

- `AuthDebug`: 显示认证状态和用户信息
- `VercelDiagnostic`: 检查环境变量、Supabase连接和API可达性

这些组件只在开发环境中显示，可以帮助你确认配置是否正确。

## 🚨 常见错误及解决方案

### 错误：`Environment variables not initialized`

**原因**：环境变量API无法访问或返回空值
**解决**：
1. 检查 Vercel 环境变量是否正确设置
2. 确保变量名称完全匹配（包括大小写）
3. 重新部署后等待生效

### 错误：`Supabase client not available`

**原因**：Supabase URL 或密钥错误
**解决**：
1. 验证 Supabase 项目 URL 和密钥
2. 确保在 Supabase 项目设置中添加了正确的 Site URL

### 错误：`401 Unauthorized` on API calls

**原因**：认证token无效或缺失
**解决**：
1. 检查用户是否正确登录
2. 验证 Supabase 认证配置
3. 确保会话没有过期

### 错误：GitHub OAuth callback failed

**原因**：回调URL仍然指向localhost
**解决**：
1. 更新 GitHub OAuth App 的回调URL
2. 确保 Vercel 域名正确

## 📋 检查清单

- [ ] Vercel 环境变量全部正确设置
- [ ] Supabase Site URL 更新为 Vercel 域名
- [ ] Supabase Redirect URLs 包含 Vercel 域名
- [ ] GitHub OAuth 回调URL 更新
- [ ] 重新部署完成
- [ ] 测试登录功能
- [ ] 测试 GitHub OAuth
- [ ] 测试支付功能

## 🎯 验证方法

1. 访问 `https://your-app.vercel.app/api/env` 检查环境变量
2. 访问 `https://your-app.vercel.app/api/supabase-test` 检查Supabase连接
3. 尝试登录和注册功能
4. 测试 GitHub OAuth 流程
5. 测试支付功能

如果问题仍然存在，查看浏览器开发者工具的控制台日志，诊断组件会提供详细的错误信息。
