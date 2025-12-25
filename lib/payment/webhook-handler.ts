/**
 * 统一 webhook 处理器
 * 处理 PayPal 和 Stripe 的 webhook 事件
 */

import { supabaseAdmin } from "@/lib/supabase";

export class WebhookHandler {
  private static instance: WebhookHandler;

  static getInstance(): WebhookHandler {
    if (!WebhookHandler.instance) {
      WebhookHandler.instance = new WebhookHandler();
    }
    return WebhookHandler.instance;
  }

  /**
   * 处理 webhook 事件
   */
  async processWebhook(
    provider: "paypal" | "stripe",
    eventType: string,
    eventData: any
  ): Promise<boolean> {
    try {
      console.log(`Processing ${provider} webhook: ${eventType}`);

      // 根据提供商和事件类型处理
      switch (provider) {
        case "paypal":
          return await this.handlePayPalEvent(eventType, eventData);
        case "stripe":
          return await this.handleStripeEvent(eventType, eventData);
        default:
          console.warn(`Unknown provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error(`Error processing ${provider} webhook:`, error);
      return false;
    }
  }

  /**
   * 处理 PayPal 事件
   */
  private async handlePayPalEvent(
    eventType: string,
    eventData: any
  ): Promise<boolean> {
    const resource = eventData.resource || {};

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        // PayPal 支付完成
        return await this.handlePaymentSuccess("paypal", resource);
      case "CHECKOUT.ORDER.APPROVED":
        // 订单批准，等待捕获完成
        console.log("PayPal order approved, waiting for capture completion");
        return true;
      default:
        console.log(`Unhandled PayPal event: ${eventType}`);
        return true;
    }
  }

  /**
   * 处理 Stripe 事件
   */
  private async handleStripeEvent(
    eventType: string,
    eventData: any
  ): Promise<boolean> {
    const data = eventData.data?.object || {};

    console.log(`🔄 Processing Stripe event: ${eventType}`, {
      eventId: eventData.id,
      userId: data.metadata?.userId,
      amount: data.amount_total ? data.amount_total / 100 : 0,
      currency: data.currency,
      paymentStatus: data.payment_status,
    });

    switch (eventType) {
      case "checkout.session.completed":
        return await this.handleStripeCheckoutCompleted(data);
      default:
        console.log(`Unhandled Stripe event: ${eventType}`);
        return true;
    }
  }

  /**
   * 处理支付成功事件（PayPal）
   */
  private async handlePaymentSuccess(
    provider: "paypal",
    data: any
  ): Promise<boolean> {
    try {
      let userId = "";
      let amount = 0;
      let currency = "USD";
      let days = 30;
      let transactionId = "";

      // 从 PayPal capture 数据中提取信息
      if (data.purchase_units && data.purchase_units.length > 0) {
        const purchaseUnit = data.purchase_units[0];
        userId = purchaseUnit.custom_id || "";
        if (purchaseUnit.amount) {
          amount = parseFloat(purchaseUnit.amount.value || "0");
          currency = purchaseUnit.amount.currency_code || "USD";
        }
      }

      // 从 captures 中获取 transaction ID
      if (data.captures && data.captures.length > 0) {
        transactionId = data.captures[0].id;
      } else {
        transactionId = data.id;
      }

      if (!userId || !transactionId) {
        console.error("Missing userId or transactionId for PayPal payment");
        return false;
      }

      // 查找 pending 支付记录以获取天数
      const { data: pendingPayment } = await supabaseAdmin
        .from("payments")
        .select("metadata")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (pendingPayment?.metadata?.days) {
        days =
          typeof pendingPayment.metadata.days === "string"
            ? parseInt(pendingPayment.metadata.days, 10)
            : pendingPayment.metadata.days;
      } else {
        // 根据金额推断天数
        days = amount >= 99 ? 365 : 30;
      }

      // 更新订阅状态
      return await this.updateSubscriptionStatus(
        userId,
        transactionId,
        "active",
        provider,
        amount,
        currency,
        days
      );
    } catch (error) {
      console.error("Error handling payment success:", error);
      return false;
    }
  }

  /**
   * 处理 Stripe checkout 完成事件
   */
  private async handleStripeCheckoutCompleted(session: any): Promise<boolean> {
    try {
      const userId = session.metadata?.userId;
      const days = session.metadata?.days
        ? parseInt(session.metadata.days, 10)
        : 30;
      const amount = (session.amount_total || 0) / 100;
      const currency = (session.currency || "USD").toUpperCase();
      const transactionId = session.id;

      console.log(`💳 Processing Stripe checkout completion:`, {
        userId,
        transactionId,
        amount,
        currency,
        days,
        paymentStatus: session.payment_status,
      });

      if (!userId) {
        console.error("❌ Missing userId in Stripe checkout session");
        return false;
      }

      if (session.payment_status !== "paid") {
        console.log(`⚠️ Payment not completed yet. Status: ${session.payment_status}`);
        return true; // 不处理未完成的支付
      }

      const result = await this.updateSubscriptionStatus(
        userId,
        transactionId,
        "active",
        "stripe",
        amount,
        currency,
        days
      );

      if (result) {
        console.log(`✅ Successfully processed Stripe payment for user ${userId}`);
      } else {
        console.error(`❌ Failed to update subscription for user ${userId}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Error handling Stripe checkout completed:", error);
      return false;
    }
  }

  /**
   * 更新订阅状态
   */
  private async updateSubscriptionStatus(
    userId: string,
    transactionId: string,
    status: string,
    provider: "paypal" | "stripe",
    amount: number,
    currency: string,
    days: number
  ): Promise<boolean> {
    try {
      const now = new Date();

      // 根据支付金额确定订阅等级
      let subscriptionTier: string;
      if (amount >= 999) {
        subscriptionTier = 'premium'; // 旗舰版
      } else if (amount >= 299) {
        subscriptionTier = 'pro'; // 专业版
      } else if (amount >= 99) {
        subscriptionTier = 'basic'; // 基础版
      } else {
        subscriptionTier = 'free'; // 免费版（降级处理）
      }

      // 计算新的到期时间
      let newPeriodEnd: Date;

      // 检查是否已有活跃订阅
      const { data: existingSubscription } = await supabaseAdmin
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (existingSubscription) {
        // 更新现有订阅
        const existingEnd = new Date(existingSubscription.current_period_end);
        if (existingEnd > now) {
          // 从现有期限延长
          newPeriodEnd = new Date(
            existingEnd.getTime() + days * 24 * 60 * 60 * 1000
          );
        } else {
          // 从现在开始
          newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            subscription_tier: subscriptionTier,
            status,
            stripe_subscription_id: provider === 'stripe' ? transactionId : null,
            current_period_end: newPeriodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", existingSubscription.id);
      } else {
        // 创建新订阅
        newPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        await supabaseAdmin.from("user_subscriptions").insert({
          user_id: userId,
          subscription_tier: subscriptionTier,
          status,
          stripe_subscription_id: provider === 'stripe' ? transactionId : null,
          current_period_start: now.toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
        });
      }

      // 更新支付记录状态
      await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          updated_at: now.toISOString(),
        })
        .eq("transaction_id", transactionId)
        .eq("status", "pending");

      console.log("Subscription status updated successfully", {
        userId,
        transactionId,
        subscriptionTier,
        days,
        newPeriodEnd: newPeriodEnd.toISOString(),
      });

      return true;
    } catch (error) {
      console.error("Error updating subscription status:", error);
      return false;
    }
  }
}








