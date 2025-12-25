import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Initiate GitHub OAuth flow
 * GET /api/github/auth
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User verification error:', userError)
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get GitHub OAuth configuration
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth not configured')
      return NextResponse.json(
        {
          error: 'GitHub OAuth not configured',
          setupUrl: `${appUrl}/github-setup`
        },
        { status: 500 }
      )
    }

    // Create state parameter with user ID
    const stateData = {
      userId: user.id,
      timestamp: Date.now()
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64')

    // Build GitHub OAuth URL
    const scopes = ['repo', 'user:email'] // Request access to repositories and email
    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', `${appUrl}/api/github/callback`)
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('allow_signup', 'true')

    console.log('Generated GitHub OAuth URL for user:', user.id)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Redirect user to this URL for GitHub OAuth'
    })

  } catch (error: any) {
    console.error('Error initiating GitHub OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}