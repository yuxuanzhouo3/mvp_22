"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const sessionId = searchParams.get("session_id"); // Stripe
      const token = searchParams.get("token"); // PayPal

      if (!sessionId && !token) {
        setStatus("error");
        setError("Missing payment confirmation parameters");
        return;
      }

      if (!session?.access_token) {
        setStatus("error");
        setError("Not authenticated");
        return;
      }

      try {
        const params = new URLSearchParams();
        if (sessionId) params.set("session_id", sessionId);
        if (token) params.set("token", token);

        const response = await fetch(
          `/api/payment/onetime/confirm?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Payment confirmation failed");
        }

        const result = await response.json();
        if (result.success) {
          setStatus("success");
          // 刷新用户信息
          setTimeout(() => {
            router.push("/payment");
          }, 2000);
        } else {
          throw new Error(result.error || "Payment confirmation failed");
        }
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Payment confirmation failed"
        );
      }
    };

    confirmPayment();
  }, [searchParams, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">
                Confirming Payment...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your payment has been confirmed. Redirecting...
              </p>
              <Button onClick={() => router.push("/payment")}>
                Go to Payment Page
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-4 text-red-600">✕</div>
              <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.push("/payment")}>
                  Go Back
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}



















