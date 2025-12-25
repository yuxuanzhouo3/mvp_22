'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'

/**
 * 认证状态调试组件
 * 用于诊断 Vercel 部署时的认证问题
 */
export function AuthDebug() {
  const { user, session, loading } = useAuth()
  const [envStatus, setEnvStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [envData, setEnvData] = useState<any>(null)

  useEffect(() => {
    // 检查环境变量 API
    fetch('/api/env')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json()
          setEnvData(data)
          setEnvStatus('success')
        } else {
          setEnvStatus('error')
        }
      })
      .catch(() => {
        setEnvStatus('error')
      })
  }, [])

  // 只在开发环境下显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="mb-2 font-bold">Auth Debug (Dev Only)</div>

      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? `${user.email || 'no email'} (${user.id?.slice(0, 8)}...)` : 'null'}</div>
        <div>Session: {session ? 'valid' : 'null'}</div>
        <div>Token: {session?.access_token ? `${session.access_token.slice(0, 10)}...` : 'none'}</div>

        <div className="mt-2">
          Env Status: {envStatus}
          {envData && (
            <div className="ml-2">
              <div>URL: {envData.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</div>
              <div>Key: {envData.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
