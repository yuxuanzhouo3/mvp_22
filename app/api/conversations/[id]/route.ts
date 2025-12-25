import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

// GET: 获取对话详情（包括消息和文件）
export async function GET(
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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    // 获取对话信息
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 获取消息
    const { data: messages, error: msgError } = await supabaseAdmin
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    // 获取文件
    const { data: files, error: filesError } = await supabaseAdmin
      .from("conversation_files")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    return NextResponse.json({
      success: true,
      conversation,
      messages: messages || [],
      files: files || [],
    })
  } catch (error: any) {
    console.error("Get conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: 删除对话
export async function DELETE(
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

    // 删除对话（级联删除会同时删除消息和文件）
    const { error: deleteError } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", conversationId)

    if (deleteError) {
      console.error("Error deleting conversation:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("Delete conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT: 更新对话标题
export async function PUT(
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
    const { title } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    // 更新对话标题
    const { data: conversation, error: updateError } = await supabaseAdmin
      .from("conversations")
      .update({ title })
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError || !conversation) {
      return NextResponse.json(
        { error: "Failed to update conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error: any) {
    console.error("Update conversation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

