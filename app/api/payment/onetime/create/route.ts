/**
 * 创建一次性支付订单 API
 * POST /api/payment/onetime/create
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { PayPalProvider } from "@/lib/payment/providers/paypal-provider";
import { StripeProvider } from "@/lib/payment/providers/stripe-provider";
import {
  getPricingByMethod,
  getDaysByBillingCycle,
  type PaymentMethod,
  type BillingCycle,
} from "@/lib/payment/payment-config";

export async function POST(request: NextRequest) {
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
    const { method, billingCycle } = body as {
      method: PaymentMethod;
      billingCycle: BillingCycle;
    };

    // 验证参数
    if (!method || !billingCycle) {
      return NextResponse.json(
        { success: false, error: "Missing payment method or billing cycle" },
        { status: 400 }
      );
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid billing cycle. Must be 'monthly' or 'yearly'",
        },
        { status: 400 }
      );
    }

    // 只支持国际版的 PayPal 和 Stripe
    if (method !== "paypal" && method !== "stripe") {
      return NextResponse.json(
        { success: false, error: "Only PayPal and Stripe are supported" },
        { status: 400 }
      );
    }

    // 获取定价信息
    const pricing = getPricingByMethod(method);
    const currency = pricing.currency;
    const amount = pricing[billingCycle];
    const days = getDaysByBillingCycle(billingCycle);

    // 检查重复支付请求（最近1分钟）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentPayments } = await supabaseAdmin
      .from("payments")
      .select("id, status, created_at")
      .eq("user_id", user.id)
      .eq("amount", amount)
      .eq("currency", currency)
      .eq("payment_method", method)
      .gte("created_at", oneMinuteAgo)
      .in("status", ["pending", "completed"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentPayments && recentPayments.length > 0) {
      const latestPayment = recentPayments[0];
      const paymentAge =
        Date.now() - new Date(latestPayment.created_at).getTime();
      const waitTime = Math.ceil((60000 - paymentAge) / 1000);

      return NextResponse.json(
        {
          success: false,
          error:
            "You have a recent payment request. Please wait a moment before trying again.",
          code: "DUPLICATE_PAYMENT_REQUEST",
          waitTime: waitTime > 0 ? waitTime : 0,
          existingPaymentId: latestPayment.id,
        },
        { status: 429 }
      );
    }

    // 创建支付订单
    const order = {
      amount,
      currency,
      description: `${
        billingCycle === "monthly" ? "1 Month" : "1 Year"
      } Premium Membership`,
      userId: user.id,
      planType: "pro",
      billingCycle,
      metadata: {
        days,
        paymentType: "onetime",
        billingCycle,
      },
    };

    let result;

    if (method === "stripe") {
      const stripeProvider = new StripeProvider();
      result = await stripeProvider.createOnetimePayment(order);
    } else if (method === "paypal") {
      const paypalProvider = new PayPalProvider();
      result = await paypalProvider.createOnetimePayment(order);
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported payment method: ${method}` },
        { status: 400 }
      );
    }

    if (!result.success || !result.paymentId) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Payment creation failed",
        },
        { status: 500 }
      );
    }

    // 记录支付到数据库
    const paymentData = {
      user_id: user.id,
      amount,
      currency,
      status: "pending",
      payment_method: method,
      transaction_id: result.paymentId,
      metadata: {
        days,
        paymentType: "onetime",
        billingCycle,
      },
    };

    const { error: paymentRecordError } = await supabaseAdmin
      .from("payments")
      .insert([paymentData]);

    if (paymentRecordError) {
      console.error("Error recording payment:", paymentRecordError);
      // 继续执行，不阻断支付流程
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment creation error:", error);
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

