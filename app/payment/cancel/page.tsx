"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

// 禁用静态生成，强制动态渲染
export const dynamic = 'force-dynamic';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h2 className="text-xl font-semibold mb-2">Payment Cancelled</h2>
            <p className="text-muted-foreground mb-4">
              Your payment was cancelled. No charges were made.
            </p>
            <Button onClick={() => router.push("/payment")}>
              Return to Payment Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



















