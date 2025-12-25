/**
 * Stripe 支付提供商实现
 * 用于国际版（INTL）的一次性支付
 */

import Stripe from "stripe";

export interface StripeOrder {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  planType: string;
  billingCycle: "monthly" | "yearly";
  metadata?: Record<string, any>;
}

export interface StripePaymentResult {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  error?: string;
}

export class StripeProvider {
  private stripe: Stripe | null = null;
  private publishableKey: string;
  private webhookSecret: string;
  private successUrl: string;
  private cancelUrl: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";

    this.publishableKey =
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    this.successUrl = `${appUrl}/payment/success`;
    this.cancelUrl = `${appUrl}/payment/cancel`;

    // 检查 API Key 是否是占位符或无效值
    const isPlaceholder =
      secretKey.includes("**") ||
      secretKey === "" ||
      secretKey === "sk_test_example" ||
      secretKey.startsWith("**");

    // ⚠️ 关键检查：确保使用的是 Secret Key 而不是 Publishable Key
    const isPublishableKey = secretKey.startsWith("pk_test_") || secretKey.startsWith("pk_live_");
    
    if (isPublishableKey) {
      console.error("❌ ERROR: STRIPE_SECRET_KEY contains a Publishable Key instead of a Secret Key!");
      console.error("   Found:", secretKey.substring(0, 20) + "...");
      console.error("   Secret Keys should start with 'sk_test_' or 'sk_live_'");
      console.error("   Publishable Keys start with 'pk_test_' or 'pk_live_'");
      console.error("   Please swap the values in your .env.local file:");
      console.error("   - STRIPE_SECRET_KEY should be the 'sk_test_...' key");
      console.error("   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should be the 'pk_test_...' key");
      this.stripe = null;
      return;
    }

    // 检查是否是有效的 Secret Key 格式
    const isValidSecretKey = secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_");

    // 只有在有有效密钥时才初始化Stripe
    if (secretKey && !isPlaceholder && isValidSecretKey) {
      try {
        this.stripe = new Stripe(secretKey);
        console.log("✅ Stripe initialized successfully with Secret Key");
      } catch (error) {
        console.error("Failed to initialize Stripe:", error);
        this.stripe = null;
      }
    } else {
      if (!isValidSecretKey && secretKey) {
        console.error("❌ Invalid Stripe Secret Key format!");
        console.error("   Secret Keys must start with 'sk_test_' or 'sk_live_'");
        console.error("   Current value starts with:", secretKey.substring(0, 10));
      } else {
        console.warn(
          "⚠️ Stripe API Key not configured or is a placeholder. Stripe payments will not work."
        );
        console.warn(
          "Please set STRIPE_SECRET_KEY in your .env.local file with a valid Stripe Secret Key (starts with 'sk_test_' or 'sk_live_')."
        );
      }
      this.stripe = null;
    }
  }

  /**
   * 创建一次性支付会话
   */
  async createOnetimePayment(
    order: StripeOrder
  ): Promise<StripePaymentResult> {
    try {
      if (!this.stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY || "";
        const isPlaceholder =
          secretKey.includes("**") ||
          secretKey === "" ||
          secretKey === "sk_test_example" ||
          secretKey.startsWith("**");

        if (isPlaceholder) {
          throw new Error(
            "Stripe API Key is not configured. Please set STRIPE_SECRET_KEY in your .env.local file with a valid Stripe API key from https://dashboard.stripe.com/apikeys"
          );
        }
        throw new Error("Stripe not initialized - missing or invalid API key");
      }

      // 创建一次性支付会话(使用 payment mode 而不是 subscription mode)
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: order.currency.toLowerCase(),
              product_data: {
                name: order.description,
                description: `${
                  order.billingCycle === "monthly" ? "30 days" : "365 days"
                } premium access`,
              },
              unit_amount: Math.round(order.amount * 100), // Stripe 使用分为单位
            },
            quantity: 1,
          },
        ],
        mode: "payment", // 关键: payment 模式表示一次性支付
        success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: this.cancelUrl,
        metadata: {
          userId: order.userId,
          paymentType: "onetime",
          days:
            order.metadata?.days ||
            (order.billingCycle === "monthly" ? "30" : "365"),
          billingCycle: order.billingCycle,
        },
      });

      return {
        success: true,
        paymentId: session.id,
        paymentUrl: session.url || "",
      };
    } catch (error) {
      console.error("Stripe createOnetimePayment error:", error);
      return {
        success: false,
        paymentId: "",
        error:
          error instanceof Error
            ? error.message
            : "Stripe payment creation failed",
      };
    }
  }

  /**
   * 确认支付（通过 session ID 获取支付状态）
   */
  async confirmPayment(sessionId: string): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    currency: string;
  }> {
    if (!this.stripe) {
      throw new Error("Stripe not initialized - missing API key");
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    return {
      success: session.payment_status === "paid",
      transactionId: session.id,
      amount: (session.amount_total || 0) / 100, // Stripe使用分作为单位
      currency: (session.currency || "USD").toUpperCase(),
    };
  }

  /**
   * 验证 webhook 签名
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.stripe) {
      return false;
    }

    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return true;
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return false;
    }
  }
}

