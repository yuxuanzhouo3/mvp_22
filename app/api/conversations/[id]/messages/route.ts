import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

// POST: 添加消息到对话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const conversationId = id
    const body = await request.json()
    const { role, content } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      )
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    // 验证对话属于当前用户
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 添加消息
    const { data: message, error: msgError } = await supabaseAdmin
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single()

    if (msgError) {
      console.error("Error adding message:", msgError)
      return NextResponse.json(
        { error: "Failed to add message" },
        { status: 500 }
      )
    }

    // 更新对话的 updated_at
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error: any) {
    console.error("Add message error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

