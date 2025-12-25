'use client'

import { useEffect } from 'react'
import { getPublicEnv } from '@/lib/env-client'

/**
 * 环境变量初始化器组件
 * 在应用启动时调用 getPublicEnv() 初始化环境变量缓存
 */
export function EnvInitializer() {
  useEffect(() => {
    // 初始化环境变量缓存
    getPublicEnv().catch((error) => {
      console.error('Failed to initialize environment variables:', error)
    })
  }, [])

  // 这个组件不渲染任何内容，只是用来初始化环境变量
  return null
}
