import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    // Check if admin client is available
    const adminAvailable = supabaseAdmin !== null

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection successful',
      session: data.session ? 'Active session found' : 'No active session',
      adminClient: adminAvailable ? 'Available' : 'Not available',
      environment: envCheck,
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