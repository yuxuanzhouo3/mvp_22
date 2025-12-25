"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

const translations = {
  en: {
    selectPaymentMethod: "Select Payment Method",
    choosePaymentMethod: "Choose your preferred payment method",
    processing: "Processing...",
    payNow: "Pay Now",
    selectMethod: "Please select a payment method",
    paymentError: "Payment error",
    recentPayment: "You have a recent payment request. Please wait a moment before trying again.",
    paymentProcessing: "Payment is being processed...",
    orderSummary: "Order Summary",
    description: "Description",
    amount: "Amount",
    securePayment: "Your payment information is securely processed by payment providers",
    safetyFeature: "This is a safety feature to prevent duplicate payments. You can try again in a moment.",
  },
  zh: {
    selectPaymentMethod: "选择支付方式",
    choosePaymentMethod: "选择您偏好的支付方式",
    processing: "处理中...",
    payNow: "立即支付",
    selectMethod: "请选择支付方式",
    paymentError: "支付错误",
    recentPayment: "您有最近的支付请求。请稍等片刻后再试。",
    paymentProcessing: "正在处理支付...",
    orderSummary: "订单摘要",
    description: "描述",
    amount: "金额",
    securePayment: "您的支付信息由支付提供商安全处理",
    safetyFeature: "这是防止重复支付的安全功能。您可以稍后再次尝试。",
  },
};

interface PaymentFormProps {
  planId: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  description: string;
  userId: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  language?: "en" | "zh";
}

export function PaymentForm({
  planId,
  billingCycle,
  amount,
  currency,
  description,
  userId,
  onSuccess,
  onError,
  language = "en",
}: PaymentFormProps) {
  const t = translations[language];
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { session } = useAuth();
  const { toast: toastHook } = useToast();
  const paymentRequestRef = useRef<string | null>(null);

  // 国际版支持的支付方式
  const availableMethods = [
    { id: "stripe", name: "Stripe", icon: <CreditCard className="h-5 w-5" /> },
    { id: "paypal", name: "PayPal", icon: <CreditCard className="h-5 w-5" /> },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      onError(t.selectMethod);
      return;
    }

    if (isProcessing) {
      return;
    }

    const idempotencyKey = `${userId}-${planId}-${billingCycle}-${amount}-${Date.now()}`;

    if (paymentRequestRef.current === idempotencyKey) {
      return;
    }

    paymentRequestRef.current = idempotencyKey;
    setIsProcessing(true);

    try {
      const token = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/payment/onetime/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          method: selectedMethod,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 处理重复支付请求错误
        if (response.status === 429 && errorData.code === "DUPLICATE_PAYMENT_REQUEST") {
          const waitTime = errorData.waitTime || 60;
          const message = `You have a recent payment request. Please wait ${waitTime} seconds before trying again.`;
          setErrorMessage(message);
          throw new Error(message);
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        onSuccess(result);
        // 跳转到支付页面
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(errorMsg);
      onError(errorMsg);
      toastHook({
        title: "Payment Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        paymentRequestRef.current = null;
        setErrorMessage(""); // 清除错误消息
      }, 5000);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t.selectPaymentMethod}
        </CardTitle>
        <CardDescription>{t.choosePaymentMethod}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 错误提示 */}
        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            {errorMessage.includes("wait") && (
              <p className="text-xs text-muted-foreground mt-2">
                {t.safetyFeature}
              </p>
            )}
          </div>
        )}

        {/* 订单摘要 */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">{t.orderSummary}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{description}</span>
              <span>{formatAmount(amount, currency)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total</span>
              <span>{formatAmount(amount, currency)}</span>
            </div>
          </div>
        </div>

        {/* 支付方式选择 */}
        <div className="space-y-3">
          <h3 className="font-medium">Payment Methods</h3>
          <div className="grid gap-3">
            {availableMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isProcessing ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={() => !isProcessing && setSelectedMethod(method.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Secure payment processing
                      </div>
                    </div>
                  </div>
                  {selectedMethod === method.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 支付按钮 */}
        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.processing}
            </>
          ) : (
            <>
              {t.payNow} {formatAmount(amount, currency)}
            </>
          )}
        </Button>

        {/* 安全提示 */}
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            <CreditCard className="h-4 w-4" />
            {t.securePayment}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

