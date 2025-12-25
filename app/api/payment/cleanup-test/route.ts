/**
 * 清理测试支付数据 API（仅用于开发环境）
 * POST /api/payment/cleanup-test
 * 
 * ⚠️ 警告：此 API 仅应在开发/测试环境使用
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // 只在开发环境允许
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // 验证用户认证
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // 验证用户
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cleanupType = "pending" } = body as {
      cleanupType?: "pending" | "all";
    };

    let deletedCount = 0;

    if (cleanupType === "pending") {
      // 只删除 pending 状态的支付记录
      const { data: deletedPayments, error: deleteError } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "pending")
        .select("id");

      if (deleteError) {
        console.error("Error deleting pending payments:", deleteError);
        return NextResponse.json(
          { success: false, error: "Failed to cleanup payments" },
          { status: 500 }
        );
      }

      deletedCount = deletedPayments?.length || 0;
    } else if (cleanupType === "all") {
      // 删除所有测试支付记录（谨慎使用）
      const { data: deletedPayments, error: deleteError } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("user_id", user.id)
        .select("id");

      if (deleteError) {
        console.error("Error deleting payments:", deleteError);
        return NextResponse.json(
          { success: false, error: "Failed to cleanup payments" },
          { status: 500 }
        );
      }

      deletedCount = deletedPayments?.length || 0;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} payment record(s)`,
      deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
























