# Supabase 配置指南

## 概述

你的项目已经成功配置了 Supabase 数据库。本文档将指导你完成所有必要的设置步骤。

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息并创建项目
4. 等待项目初始化完成（大约 2-3 分钟）

## 2. 获取 API 密钥

在 Supabase 项目设置中：

1. 进入 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: 公共 API 密钥
   - **service_role key**: 服务角色密钥（保密）

## 3. 配置环境变量

1. 创建 `.env.local` 文件（已在项目根目录创建模板）
2. 填入从 Supabase 获取的实际值：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

## 4. 设置数据库表

1. 在 Supabase Dashboard 中进入 "SQL Editor"
2. 复制 `supabase-schema.sql` 文件中的 SQL 命令
3. 执行这些命令来创建表和安全策略

## 5. 文件说明

### 核心文件
- `lib/supabase.ts` - Supabase 客户端配置
- `lib/supabase-example.ts` - 使用示例和常用函数
- `supabase-schema.sql` - 数据库表结构和安全策略

### 环境变量
- `.env.example` - 环境变量模板
- `.env.local` - 你的实际环境变量（已添加到 .gitignore）

## 6. 使用示例

### 认证
```typescript
import { signUp, signIn, signOut } from '@/lib/supabase-example'

// 注册
const { data, error } = await signUp('user@example.com', 'password')

// 登录
const { data, error } = await signIn('user@example.com', 'password')

// 登出
await signOut()
```

### 数据库操作
```typescript
import { getPosts, createPost } from '@/lib/supabase-example'

// 获取所有文章
const { data: posts, error } = await getPosts()

// 创建新文章
const { data: newPost, error } = await createPost('标题', '内容')
```

### 实时订阅
```typescript
import { subscribeToPosts } from '@/lib/supabase-example'

const subscription = subscribeToPosts((payload) => {
  console.log('文章更新:', payload)
})

// 取消订阅
subscription.unsubscribe()
```

## 7. 安全注意事项

- ✅ `NEXT_PUBLIC_` 前缀的环境变量会暴露给客户端
- ❌ 不要在客户端代码中使用 `SUPABASE_SERVICE_ROLE_KEY`
- ✅ 始终启用 Row Level Security (RLS)
- ✅ 使用 Supabase 的认证系统
- ✅ 在生产环境中定期轮换 API 密钥

## 8. 故障排除

### 常见问题

1. **环境变量未加载**
   - 确保 `.env.local` 文件存在且格式正确
   - 重启开发服务器

2. **权限错误**
   - 检查数据库表的 RLS 策略
   - 确保用户已认证

3. **实时功能不工作**
   - 检查 Supabase 项目的实时设置
   - 确认表已启用实时功能

## 9. 下一步

- 查看 `lib/supabase-example.ts` 中的完整示例
- 根据你的需求修改数据库表结构
- 实现用户界面组件来与 Supabase 交互
- 设置存储桶用于文件上传

## 支持

如果遇到问题，请查看：
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 环境变量指南](https://nextjs.org/docs/basic-features/environment-variables)





