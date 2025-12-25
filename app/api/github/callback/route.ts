import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * Handle GitHub OAuth callback
 * GET /api/github/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=missing_parameters`
    )
  }

  try {
    // Decode state to get userId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const userId = stateData.userId

    if (!userId) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth not configured')
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user info')
    }

    const githubUser = await userResponse.json()

    // Store GitHub token in Supabase
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not configured. GitHub token cannot be stored.')
      // Redirect with success anyway, but user won't be able to use GitHub features
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}&github_warning=token_not_stored`
      )
    }

    // Try to insert or update the token
    const { error: dbError } = await supabaseAdmin
      .from('user_github_tokens')
      .upsert({
        user_id: userId,
        github_token: accessToken,
        github_username: githubUser.login,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Error storing GitHub token:', dbError)
      // If table doesn't exist, redirect with warning
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}&github_warning=db_error`
      )
    }

    // Redirect back to generate page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}`
    )
  } catch (error: any) {
    console.error('Error handling GitHub callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(error.message)}`
    )
  }
}

