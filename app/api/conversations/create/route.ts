import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    // 创建新对话
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .insert({
        user_id: user.id,
        title: title || "New Conversation",
      })
      .select()
      .single()

    if (convError) {
      console.error("Error creating conversation:", convError)
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error: any) {
    console.error("Create conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}





















