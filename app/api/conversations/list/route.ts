import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("List conversations API called")

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No auth header or invalid format")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log("Token extracted, getting user...")

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log("User error or no user:", userError)
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    console.log("User authenticated:", user.id)

    if (!supabaseAdmin) {
      console.log("No supabaseAdmin available")
      return NextResponse.json(
        { conversations: [] },
        { status: 200 }
      )
    }

    console.log("Fetching conversations for user:", user.id)

    // 获取用户的所有对话，按更新时间倒序
    const { data: conversations, error } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Database error fetching conversations:", error)
      return NextResponse.json(
        { error: "Failed to fetch conversations", details: error.message },
        { status: 500 }
      )
    }

    console.log("Successfully fetched", conversations?.length || 0, "conversations")

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
    })
  } catch (error: any) {
    console.error("Unexpected error in list conversations:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    )
  }
}

