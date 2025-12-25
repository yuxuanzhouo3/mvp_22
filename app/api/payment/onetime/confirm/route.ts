/**
 * 确认一次性支付 API
 * GET /api/payment/onetime/confirm?session_id=...&token=...
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { PayPalProvider } from "@/lib/payment/providers/paypal-provider";
import { StripeProvider } from "@/lib/payment/providers/stripe-provider";

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

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id"); // Stripe
    const paypalToken = searchParams.get("token"); // PayPal

    if (!sessionId && !paypalToken) {
      return NextResponse.json(
        { success: false, error: "Missing payment confirmation parameters" },
        { status: 400 }
      );
    }

    let transactionId = "";
    let amount = 0;
    let currency = "USD";
    let days = 30;

    if (sessionId) {
      // Stripe 支付确认
      const stripeProvider = new StripeProvider();
      const confirmation = await stripeProvider.confirmPayment(sessionId);

      if (!confirmation.success) {
        return NextResponse.json(
          { success: false, error: "Payment not completed" },
          { status: 400 }
        );
      }

      transactionId = confirmation.transactionId;
      amount = confirmation.amount;
      currency = confirmation.currency;

      // 从 pending payment 获取天数
      const { data: pendingPayment } = await supabaseAdmin
        .from("payments")
        .select("metadata")
        .eq("transaction_id", sessionId)
        .eq("status", "pending")
        .maybeSingle();

      days = pendingPayment?.metadata?.days || (amount > 50 ? 365 : 30);
    } else if (paypalToken) {
      // PayPal 支付确认
      const paypalProvider = new PayPalProvider();
      
      try {
        const captureResult = await paypalProvider.captureOnetimePayment(
          paypalToken
        );

        // 检查订单状态
        const orderStatus = captureResult.status;
        
        if (orderStatus !== "COMPLETED") {
          return NextResponse.json(
            { 
              success: false, 
              error: `Payment order is in ${orderStatus} status. Expected COMPLETED.` 
            },
            { status: 400 }
          );
        }

        // 从 capture 结果中提取信息
        // transactionId 应该是 capture ID，而不是 order ID
        let captureId = captureResult.id; // Order ID
        
        if (
          captureResult.purchase_units &&
          captureResult.purchase_units.length > 0
        ) {
          const purchaseUnit = captureResult.purchase_units[0];
          if (purchaseUnit.payments?.captures?.[0]) {
            const capture = purchaseUnit.payments.captures[0];
            captureId = capture.id; // 使用 capture ID 作为 transaction ID
            amount = parseFloat(capture.amount?.value || "0");
            currency = capture.amount?.currency_code || "USD";
          }
        }

        transactionId = captureId || paypalToken; // 如果没有 capture ID，使用 order ID

        // 从 pending payment 获取天数
        const { data: pendingPayment } = await supabaseAdmin
          .from("payments")
          .select("metadata")
          .eq("transaction_id", paypalToken) // 使用 order ID 查找
          .eq("status", "pending")
          .maybeSingle();

        days = pendingPayment?.metadata?.days || (amount > 50 ? 365 : 30);
      } catch (error) {
        console.error("PayPal capture error:", error);
        
        // 如果捕获失败，检查订单是否已经完成
        try {
          const orderDetails = await paypalProvider.getOrderDetails(paypalToken);
          if (orderDetails.status === "COMPLETED") {
            // 订单已完成，继续处理
            const purchaseUnit = orderDetails.purchase_units?.[0];
            if (purchaseUnit?.payments?.captures?.[0]) {
              const capture = purchaseUnit.payments.captures[0];
              transactionId = capture.id;
              amount = parseFloat(capture.amount?.value || "0");
              currency = capture.amount?.currency_code || "USD";
            } else {
              transactionId = paypalToken;
            }
            
            // 从 pending payment 获取天数
            const { data: pendingPayment } = await supabaseAdmin
              .from("payments")
              .select("metadata")
              .eq("transaction_id", paypalToken)
              .eq("status", "pending")
              .maybeSingle();

            days = pendingPayment?.metadata?.days || (amount > 50 ? 365 : 30);
          } else {
            throw error; // 重新抛出错误
          }
        } catch (checkError) {
          // 如果检查也失败，返回原始错误
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "PayPal payment confirmation failed",
            },
            { status: 500 }
          );
        }
      }
    }

    // 检查是否已处理
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("transaction_id", transactionId)
      .eq("status", "completed")
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        transactionId,
      });
    }

    // 更新支付记录状态
    const paymentIdToUpdate = sessionId || paypalToken;
    const { data: pendingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, amount, currency")
      .eq("transaction_id", paymentIdToUpdate)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingPayment) {
      if (amount === 0 && pendingPayment.amount) {
        amount = pendingPayment.amount;
      }
      if (!currency && pendingPayment.currency) {
        currency = pendingPayment.currency;
      }

      await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          transaction_id: transactionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingPayment.id);
    }

    // PayPal 和 Stripe 的会员延期由 webhook 处理，这里只确认支付成功
    console.log(
      "Payment confirmed - membership extension will be handled by webhook",
      {
        userId: user.id,
        transactionId,
        days,
      }
    );

    return NextResponse.json({
      success: true,
      transactionId,
      amount,
      currency,
      daysAdded: days,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
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

