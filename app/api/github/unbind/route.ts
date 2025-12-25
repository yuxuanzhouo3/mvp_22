import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User verification error:', userError)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'GitHub integration requires Supabase admin configuration. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Delete GitHub token from database
    const { error: deleteError } = await supabaseAdmin
      .from('user_github_tokens')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting GitHub token:', deleteError)
      return NextResponse.json({ error: 'Failed to unbind GitHub account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub account unbound successfully'
    })
  } catch (error: any) {
    console.error('Error unbinding GitHub:', error)
    return NextResponse.json({ error: 'Failed to unbind GitHub account' }, { status: 500 })
  }
}

























