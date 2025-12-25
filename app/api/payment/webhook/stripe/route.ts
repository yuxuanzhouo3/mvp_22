/**
 * Stripe Webhook 处理
 * POST /api/payment/webhook/stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { WebhookHandler } from "@/lib/payment/webhook-handler";
import { StripeProvider } from "@/lib/payment/providers/stripe-provider";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // 验证 Stripe webhook 签名
    const stripeProvider = new StripeProvider();
    const isValidSignature = stripeProvider.verifyWebhookSignature(
      body,
      signature
    );

    if (!isValidSignature) {
      console.error("Stripe webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 解析 webhook 数据
    const webhookData = JSON.parse(body);
    const eventType = webhookData.type;

    console.log("Received Stripe webhook:", {
      eventType,
      eventId: webhookData.id,
    });

    // 处理 webhook 事件
    const webhookHandler = WebhookHandler.getInstance();
    const success = await webhookHandler.processWebhook(
      "stripe",
      eventType,
      webhookData
    );

    if (success) {
      return NextResponse.json({ status: "success" });
    } else {
      console.error("Failed to process Stripe webhook");
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
























