"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase, createSupabaseClient } from './supabase'

// Mock user type for when Supabase is not available
interface MockUser {
  id: string
  email: string
  name?: string
}

interface MockSession {
  user: MockUser
  access_token: string
  refresh_token: string
}

interface AuthContextType {
  user: (User | MockUser) | null
  session: (Session | MockSession) | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User | MockUser) | null>(null)
  const [session, setSession] = useState<(Session | MockSession) | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(supabase)

  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    async function initializeAuth() {
      console.log('Initializing authentication...')

      // 等待环境变量初始化
      try {
        await new Promise(resolve => setTimeout(resolve, 100)) // 给环境变量初始化一点时间
      } catch (error) {
        console.warn('Environment initialization delay failed:', error)
      }

      // 如果服务器端已经有 supabase client，直接使用
      if (supabase) {
        console.log('Using server-side Supabase client')
        await setupAuth(supabase)
        return
      }

      // 客户端：尝试从 API 获取环境变量并创建 client
      try {
        console.log('Creating client-side Supabase client...')
        const client = await createSupabaseClient()
        console.log('Supabase client created:', !!client)

        if (mounted) {
          setSupabaseClient(client)
          if (client) {
            await setupAuth(client)
          } else {
            console.warn('Failed to create Supabase client, using mock auth')
            // 如果无法创建 client，使用 mock
            setupMockAuth()
          }
        }
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error)
        if (mounted) {
          setupMockAuth()
        }
      }
    }

    async function setupAuth(client: SupabaseClient) {
      if (!mounted) return

      try {
        console.log('Setting up authentication...')

        // Get initial session
        const { data: { session }, error } = await client.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setSession(null)
            setUser(null)
            setLoading(false)
          }
          return
        }

        console.log('Initial session:', session ? 'found' : 'none')
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return
            console.log('Auth state changed:', event, session?.user?.email || 'no user', session ? 'valid session' : 'no session')
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
          }
        )

        subscription = authSubscription
        if (mounted) {
          setLoading(false)
        }

        console.log('Authentication setup completed')
      } catch (error) {
        console.error('Failed to setup authentication:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    function setupMockAuth() {
      if (!mounted) return
      // Mock authentication for when Supabase is not configured
      const mockUser: MockUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User'
      }
      const mockSession: MockSession = {
        user: mockUser,
        access_token: 'demo-token',
        refresh_token: 'demo-refresh-token'
      }
      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
    }

    initializeAuth()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const getClient = () => {
    return supabaseClient || supabase
  }

  const signUp = async (email: string, password: string, userData?: { full_name?: string }) => {
    const client = getClient()
    if (!client) {
      // Mock signup for demo
      console.log('Mock signup:', email, userData)
      return { error: null }
    }

    try {
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { error }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Signup exception:', error)
      return {
        error: {
          message: 'Registration failed. Please check your configuration or try again later.'
        }
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const client = getClient()
    if (!client) {
      // Mock signin for demo
      console.log('Mock signin:', email)
      return { error: null }
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const client = getClient()
    if (!client) {
      // Mock signout for demo
      console.log('Mock signout')
      return
    }

    await client.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const client = getClient()
    if (!client) {
      // Mock password reset for demo
      console.log('Mock password reset:', email)
      return { error: null }
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const client = getClient()
    if (!client) {
      // Mock Google signin for demo
      console.log('Mock Google signin')
      return { error: null }
    }

    try {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Google OAuth error:', error)
        // Provide more helpful error messages
        if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          return {
            error: {
              message: 'Google OAuth 配置错误。请检查 Supabase Dashboard 中的 Google Provider 配置，确保 Client ID 和 Client Secret 正确。查看 GOOGLE_OAUTH_SETUP.md 获取详细配置说明。'
            }
          }
        }
      }
      
      return { error }
    } catch (err: any) {
      console.error('Google OAuth exception:', err)
      return {
        error: {
          message: err.message || 'Google 登录失败，请稍后重试。'
        }
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



