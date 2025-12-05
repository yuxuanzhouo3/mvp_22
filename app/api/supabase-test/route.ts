import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection by checking if we can access auth
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection successful',
      session: data.session ? 'Active session found' : 'No active session',
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error testing Supabase connection',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, email, password } = await request.json()

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({
          status: 'error',
          message: 'Signup failed',
          error: error.message
        }, { status: 400 })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Signup successful',
        data
      })
    }

    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({
          status: 'error',
          message: 'Signin failed',
          error: error.message
        }, { status: 400 })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Signin successful',
        data
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Invalid action'
    }, { status: 400 })

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: err.message
    }, { status: 500 })
  }
}
