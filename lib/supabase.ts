import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnvSync, getPublicEnv } from './env-client'

// 延迟初始化 Supabase 客户端，避免在模块加载时就访问环境变量
let supabaseClient: SupabaseClient | null = null

function getSupabaseConfig() {
  // 服务器端直接使用 process.env
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  }

  // 客户端：优先使用已初始化的环境变量
  try {
    const env = getPublicEnvSync()
    return {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  } catch (error) {
    console.warn('Supabase config: Environment variables not initialized yet')
    return {
      url: '',
      anonKey: '',
    }
  }
}

// 延迟创建客户端的函数
function createSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const config = getSupabaseConfig()
  if (config.url && config.anonKey) {
    supabaseClient = createClient(config.url, config.anonKey)
  }

  return supabaseClient
}

// 导出延迟初始化的客户端
export const supabase = typeof window === 'undefined'
  ? (() => {
      // 服务器端：立即创建
      const config = getSupabaseConfig()
      return config.url && config.anonKey ? createClient(config.url, config.anonKey) : null
    })()
  : (() => {
      // 客户端：返回代理对象，在首次访问时创建
      return new Proxy({} as any, {
        get(target, prop) {
          const client = createSupabaseClient()
          if (!client) {
            console.warn('Supabase client not available - environment variables may not be initialized')
            return () => Promise.reject(new Error('Supabase client not initialized'))
          }
          return (client as any)[prop]
        }
      })
    })()

/**
 * 异步创建 Supabase 客户端（客户端使用）
 * 从 API 获取环境变量后创建客户端
 */
export async function createSupabaseClient(): Promise<SupabaseClient | null> {
  // 服务器端直接使用同步方式
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createClient(url, anonKey) : null
  }

  // 客户端从 API 获取
  try {
    const env = await getPublicEnv()
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
  }
  
  return null
}

// For server-side operations (API routes)
// Only create admin client if service role key is available
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
}

export { supabaseAdmin }


