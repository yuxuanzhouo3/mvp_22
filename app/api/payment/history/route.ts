/**
 * 获取支付历史 API
 * GET /api/payment/history
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // 查询支付记录
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error("Error fetching payment history:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch payment history" },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const records = (payments || []).map((payment: any) => ({
      id: payment.id,
      date: payment.created_at,
      amount: payment.amount,
      currency: payment.currency,
      status:
        payment.status === "completed"
          ? "paid"
          : payment.status === "pending"
          ? "pending"
          : payment.status === "failed"
          ? "failed"
          : "refunded",
      description: `Premium Membership - ${payment.metadata?.billingCycle || "monthly"}`,
      paymentMethod: payment.payment_method,
    }));

    return NextResponse.json({
      success: true,
      records,
      page,
      pageSize,
      total: records.length,
    });
  } catch (error) {
    console.error("Payment history error:", error);
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
























