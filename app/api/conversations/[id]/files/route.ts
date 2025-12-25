import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

// POST: 保存文件到对话
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
    const { files } = body // Array of { file_path, file_content }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Files array is required" },
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

    // 批量插入或更新文件
    const fileRecords = files.map((file: { file_path: string; file_content: string }) => ({
      conversation_id: conversationId,
      file_path: file.file_path,
      file_content: file.file_content,
    }))

    const { data: savedFiles, error: filesError } = await supabaseAdmin
      .from("conversation_files")
      .upsert(fileRecords, {
        onConflict: "conversation_id,file_path",
      })
      .select()

    if (filesError) {
      console.error("Error saving files:", filesError)
      return NextResponse.json(
        { error: "Failed to save files" },
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
      files: savedFiles || [],
    })
  } catch (error: any) {
    console.error("Save files error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

