import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * Check GitHub connection status
 * GET /api/github/status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { connected: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    if (!supabase) {
      return NextResponse.json(
        { connected: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User verification error:', userError)
      return NextResponse.json(
        { connected: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if GitHub token exists
    if (!supabaseAdmin) {
      // If admin client is not configured, return not connected
      return NextResponse.json({
        connected: false,
      })
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('user_github_tokens')
      .select('github_username')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        connected: false,
      })
    }

    return NextResponse.json({
      connected: true,
      username: tokenData.github_username,
    })
  } catch (error: any) {
    console.error('Error checking GitHub status:', error)
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    )
  }
}

