'use client'

import { useEffect, useState } from 'react'

interface DiagnosticResult {
  environment: string
  envApiStatus: 'checking' | 'success' | 'error'
  envData: any
  supabaseStatus: 'checking' | 'success' | 'error'
  supabaseError?: string
  authTestStatus: 'checking' | 'success' | 'error'
  authError?: string
}

/**
 * Vercel部署诊断组件
 * 检查环境变量、Supabase连接和认证状态
 */
export function VercelDiagnostic() {
  const [result, setResult] = useState<DiagnosticResult>({
    environment: typeof window !== 'undefined' ? 'client' : 'server',
    envApiStatus: 'checking',
    envData: null,
    supabaseStatus: 'checking',
    authTestStatus: 'checking'
  })

  useEffect(() => {
    async function runDiagnostics() {
      // 1. 检查环境变量API
      try {
        console.log('Testing environment variables API...')
        const envResponse = await fetch('/api/env')
        if (envResponse.ok) {
          const envData = await envResponse.json()
          setResult(prev => ({
            ...prev,
            envApiStatus: 'success',
            envData
          }))
          console.log('Environment variables API success:', envData)
        } else {
          setResult(prev => ({
            ...prev,
            envApiStatus: 'error'
          }))
          console.error('Environment variables API failed:', envResponse.status)
        }
      } catch (error) {
        setResult(prev => ({
          ...prev,
          envApiStatus: 'error'
        }))
        console.error('Environment variables API error:', error)
      }

      // 2. 检查Supabase连接
      try {
        console.log('Testing Supabase connection...')
        const supabaseResponse = await fetch('/api/supabase-test')
        if (supabaseResponse.ok) {
          setResult(prev => ({
            ...prev,
            supabaseStatus: 'success'
          }))
          console.log('Supabase connection test passed')
        } else {
          const errorData = await supabaseResponse.json().catch(() => ({}))
          setResult(prev => ({
            ...prev,
            supabaseStatus: 'error',
            supabaseError: errorData.error || `HTTP ${supabaseResponse.status}`
          }))
          console.error('Supabase connection test failed:', errorData)
        }
      } catch (error) {
        setResult(prev => ({
          ...prev,
          supabaseStatus: 'error',
          supabaseError: String(error)
        }))
        console.error('Supabase connection test error:', error)
      }

      // 3. 测试认证API（需要有效的session）
      try {
        console.log('Testing authentication API...')
        // 尝试调用一个需要认证的API
        const authResponse = await fetch('/api/conversations/list', {
          headers: {
            'Authorization': 'Bearer test-token' // 这应该会失败，但能告诉我们API是否可达
          }
        })

        // 我们期望401错误，这意味着API是可达的，只是认证失败
        if (authResponse.status === 401) {
          setResult(prev => ({
            ...prev,
            authTestStatus: 'success' // API可达，认证按预期工作
          }))
          console.log('Authentication API reachable (401 expected)')
        } else {
          setResult(prev => ({
            ...prev,
            authTestStatus: 'error',
            authError: `Unexpected status: ${authResponse.status}`
          }))
          console.error('Authentication API unexpected response:', authResponse.status)
        }
      } catch (error) {
        setResult(prev => ({
          ...prev,
          authTestStatus: 'error',
          authError: String(error)
        }))
        console.error('Authentication API error:', error)
      }
    }

    runDiagnostics()
  }, [])

  // 只在开发环境下显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-red-900 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="mb-2 font-bold text-red-200">🚨 Vercel Diagnostic (Dev Only)</div>

      <div className="space-y-2">
        <div>Environment: <span className="text-yellow-300">{result.environment}</span></div>

        <div className="border-t border-red-700 pt-2">
          <div className="font-semibold mb-1">Environment Variables API:</div>
          <div className={`ml-2 ${
            result.envApiStatus === 'success' ? 'text-green-400' :
            result.envApiStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {result.envApiStatus === 'checking' && '⏳ Checking...'}
            {result.envApiStatus === 'success' && '✅ Success'}
            {result.envApiStatus === 'error' && '❌ Failed'}
          </div>
          {result.envData && (
            <div className="ml-4 text-xs">
              <div>URL: {result.envData.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</div>
              <div>Key: {result.envData.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
              <div>App URL: {result.envData.NEXT_PUBLIC_APP_URL ? '✅' : '❌'}</div>
            </div>
          )}
        </div>

        <div className="border-t border-red-700 pt-2">
          <div className="font-semibold mb-1">Supabase Connection:</div>
          <div className={`ml-2 ${
            result.supabaseStatus === 'success' ? 'text-green-400' :
            result.supabaseStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {result.supabaseStatus === 'checking' && '⏳ Checking...'}
            {result.supabaseStatus === 'success' && '✅ Connected'}
            {result.supabaseStatus === 'error' && '❌ Failed'}
          </div>
          {result.supabaseError && (
            <div className="ml-4 text-xs text-red-300">{result.supabaseError}</div>
          )}
        </div>

        <div className="border-t border-red-700 pt-2">
          <div className="font-semibold mb-1">Authentication API:</div>
          <div className={`ml-2 ${
            result.authTestStatus === 'success' ? 'text-green-400' :
            result.authTestStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {result.authTestStatus === 'checking' && '⏳ Checking...'}
            {result.authTestStatus === 'success' && '✅ Reachable (401 expected)'}
            {result.authTestStatus === 'error' && '❌ Failed'}
          </div>
          {result.authError && (
            <div className="ml-4 text-xs text-red-300">{result.authError}</div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-red-200 border-t border-red-700 pt-2">
        <div className="font-semibold mb-1">🔧 Quick Fixes:</div>
        <div>1. Check Vercel env vars are set</div>
        <div>2. Update Supabase Site URL</div>
        <div>3. Update GitHub OAuth callback URL</div>
      </div>
    </div>
  )
}
