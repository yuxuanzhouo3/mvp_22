/**
 * PayPal 支付提供商实现
 * 用于国际版（INTL）的一次性支付
 */

export interface PayPalOrder {
  amount: number;
  currency: string;
  description: string;
  userId: string;
  planType: string;
  billingCycle: "monthly" | "yearly";
  metadata?: Record<string, any>;
}

export interface PayPalPaymentResult {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  error?: string;
}

export class PayPalProvider {
  private clientId: string;
  private clientSecret: string;
  private environment: "sandbox" | "production";
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || "";
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    this.environment =
      (process.env.PAYPAL_ENVIRONMENT as "sandbox" | "production") || "sandbox";
    this.baseUrl =
      this.environment === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    // 检查配置是否是占位符
    const isPlaceholder =
      this.clientId.includes("**") ||
      this.clientSecret.includes("**") ||
      this.clientId === "" ||
      this.clientSecret === "";

    if (isPlaceholder) {
      console.warn(
        "⚠️ PayPal credentials not configured or are placeholders. PayPal payments will not work."
      );
      console.warn(
        "Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env.local file."
      );
    }
  }

  /**
   * 获取 PayPal 访问令牌
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64"
    );

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get PayPal access token: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * 创建一次性支付订单
   */
  async createOnetimePayment(
    order: PayPalOrder
  ): Promise<PayPalPaymentResult> {
    try {
      // 检查配置
      const isPlaceholder =
        this.clientId.includes("**") ||
        this.clientSecret.includes("**") ||
        this.clientId === "" ||
        this.clientSecret === "";

      if (isPlaceholder) {
        return {
          success: false,
          paymentId: "",
          error:
            "PayPal credentials are not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env.local file.",
        };
      }

      const accessToken = await this.getAccessToken();

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";

      // 创建 PayPal Order (一次性支付)
      const orderData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            description: order.description,
            amount: {
              currency_code: order.currency,
              value: order.amount.toFixed(2),
            },
            custom_id: order.userId, // 存储用户ID用于后续webhook
          },
        ],
        application_context: {
          brand_name: "CodeGen AI",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${appUrl}/payment/success`,
          cancel_url: `${appUrl}/payment/cancel`,
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal order creation failed: ${errorData}`);
      }

      const paypalOrder = await response.json();

      return {
        success: true,
        paymentId: paypalOrder.id,
        paymentUrl: paypalOrder.links?.find(
          (link: any) => link.rel === "approve"
        )?.href,
      };
    } catch (error) {
      console.error("PayPal createOnetimePayment error:", error);
      return {
        success: false,
        paymentId: "",
        error:
          error instanceof Error ? error.message : "PayPal payment creation failed",
      };
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get PayPal order: ${response.status} ${
            errorData.message || errorData.error || response.statusText
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("PayPal getOrderDetails error:", error);
      throw error;
    }
  }

  /**
   * 捕获一次性支付订单
   */
  async captureOnetimePayment(orderId: string): Promise<any> {
    try {
      // 先获取订单详情，检查状态
      const orderDetails = await this.getOrderDetails(orderId);
      const orderStatus = orderDetails.status;

      console.log("PayPal order status:", orderStatus, "Order ID:", orderId);

      // 如果订单已经是 COMPLETED，直接返回订单详情
      if (orderStatus === "COMPLETED") {
        console.log("PayPal order already completed, returning order details");
        return orderDetails;
      }

      // 如果订单不是 APPROVED 状态，不能捕获
      if (orderStatus !== "APPROVED") {
        throw new Error(
          `PayPal order is in ${orderStatus} status. Only APPROVED orders can be captured.`
        );
      }

      const accessToken = await this.getAccessToken();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      try {
        const response = await fetch(
          `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // 如果订单已经被捕获（422 错误），尝试获取订单详情
          if (response.status === 422) {
            console.warn("PayPal capture returned 422, checking order status...");
            try {
              const currentOrder = await this.getOrderDetails(orderId);
              if (currentOrder.status === "COMPLETED") {
                console.log("Order was already captured, returning order details");
                return currentOrder;
              }
            } catch (e) {
              // 如果获取订单详情也失败，继续抛出原始错误
            }
          }

          console.error("PayPal capture failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            orderId,
            orderStatus,
          });
          
          const errorMessage = errorData.details?.[0]?.description || 
                               errorData.message || 
                               errorData.error || 
                               response.statusText;
          
          throw new Error(
            `Failed to capture PayPal order: ${response.status} ${errorMessage}`
          );
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(
            "PayPal capture request timeout. The order may have expired. Please try creating a new payment."
          );
        }
        throw error;
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      throw error;
    }
  }
}

