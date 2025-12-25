/**
 * PayPal Webhook 处理
 * POST /api/payment/webhook/paypal
 */

import { NextRequest, NextResponse } from "next/server";
import { WebhookHandler } from "@/lib/payment/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // 获取 PayPal webhook 签名头
    const signature = request.headers.get("paypal-transmission-sig");
    const certUrl = request.headers.get("paypal-cert-url");
    const transmissionId = request.headers.get("paypal-transmission-id");
    const timestamp = request.headers.get("paypal-transmission-time");
    const authAlgo = request.headers.get("paypal-auth-algo");

    // 在开发环境下可以跳过签名验证
    const skipVerification =
      process.env.NODE_ENV === "development" ||
      process.env.PAYPAL_SKIP_SIGNATURE_VERIFICATION === "true";

    if (!skipVerification) {
      // 验证签名（简化版，生产环境需要完整验证）
      if (!signature || !certUrl || !transmissionId || !timestamp || !authAlgo) {
        console.error("Missing PayPal webhook signature headers");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 解析 webhook 数据
    const webhookData = JSON.parse(body);
    const eventType = webhookData.event_type;

    console.log("Received PayPal webhook:", {
      eventType,
      transmissionId,
      resourceId: webhookData.resource?.id,
    });

    // 处理 webhook 事件
    const webhookHandler = WebhookHandler.getInstance();
    const success = await webhookHandler.processWebhook(
      "paypal",
      eventType,
      webhookData
    );

    if (success) {
      return NextResponse.json({ status: "success" });
    } else {
      console.error("Failed to process PayPal webhook");
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
























