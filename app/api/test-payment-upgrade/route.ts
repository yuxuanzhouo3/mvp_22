/**
 * 测试支付升级功能
 * POST /api/test-payment-upgrade
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限（仅开发环境使用）
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: "Not available in production" },
        { status: 403 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const { tier = 'basic', amount = 99 } = await request.json();

    console.log(`Testing payment upgrade for user ${user.id} to ${tier} tier`);

    // 模拟webhook处理逻辑
    const now = new Date();
    const days = amount > 50 ? 365 : 30; // 假设超过50美元是年付
    const newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // 检查是否已有活跃订阅
    const { data: existingSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      // 更新现有订阅
      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          subscription_tier: tier,
          current_period_end: newPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update subscription" },
          { status: 500 }
        );
      }
    } else {
      // 创建新订阅
      const { error: insertError } = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          subscription_tier: tier,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
        });

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        return NextResponse.json(
          { success: false, error: "Failed to create subscription" },
          { status: 500 }
        );
      }
    }

    // 验证更新结果
    const { data: verifySubscription, error: verifyError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_tier, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (verifyError || verifySubscription?.subscription_tier !== tier) {
      console.error("Verification failed:", verifyError);
      return NextResponse.json(
        { success: false, error: "Subscription update verification failed" },
        { status: 500 }
      );
    }

    console.log(`Successfully upgraded user ${user.id} to ${tier} tier`);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${tier} tier`,
      subscription: {
        tier: verifySubscription.subscription_tier,
        periodEnd: verifySubscription.current_period_end,
      },
    });

  } catch (error) {
    console.error("Test payment upgrade error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
















