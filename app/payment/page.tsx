"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionPlans } from "@/components/payment/subscription-plans";
import { PaymentForm } from "@/components/payment/payment-form";
import { BillingHistory } from "@/components/payment/billing-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Globe, Home } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAmountByCurrency } from "@/lib/payment/payment-config";

const translations = {
  en: {
    loading: "Loading...",
    back: "Back",
    home: "Home",
    title: "Payment & Subscription",
    subtitle: "Manage your subscription and payment methods",
    paymentSuccess: "Payment Created Successfully",
    paymentSuccessDesc: "Please follow the instructions to complete the payment",
    plansTab: "Plans",
    paymentTab: "Payment",
    historyTab: "History",
    selectPlanFirst: "Please select a subscription plan first",
    choosePlan: "Choose Plan",
    english: "English",
    chinese: "中文",
  },
  zh: {
    loading: "加载中...",
    back: "返回",
    home: "首页",
    title: "支付与订阅",
    subtitle: "管理您的订阅和支付方式",
    paymentSuccess: "支付创建成功",
    paymentSuccessDesc: "请按照说明完成支付",
    plansTab: "套餐",
    paymentTab: "支付",
    historyTab: "历史",
    selectPlanFirst: "请先选择订阅套餐",
    choosePlan: "选择套餐",
    english: "English",
    chinese: "中文",
  },
};

export default function PaymentPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<{
    planId: string;
    billingCycle: "monthly" | "yearly";
    amount: number;
    currency: string;
    description: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("plans");

  // Language state management
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [isMounted, setIsMounted] = useState(false);

  // Load language preference from localStorage after mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('language') as "en" | "zh" | null;
        if (savedLanguage === "en" || savedLanguage === "zh") {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error reading language from localStorage:', error);
      }
    }
  }, []);

  const handleLanguageChange = (newLanguage: "en" | "zh") => {
    setLanguage(newLanguage);
    // Save language preference to localStorage when user changes it
    if (isMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', newLanguage);
      } catch (error) {
        console.error('Error saving language to localStorage:', error);
      }
    }
  };

  const t = translations[language];

  const currency = "USD"; // 国际版使用美元

  // 处理用户未登录的重定向
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSelectPlan = (
    planId: string,
    billingCycle: "monthly" | "yearly"
  ) => {
    const amount = getAmountByCurrency(currency, billingCycle);
    const description = `Pro Plan - ${billingCycle === "monthly" ? "Monthly" : "Yearly"}`;

    setSelectedPlan({
      planId,
      billingCycle,
      amount,
      currency,
      description,
    });
    setPaymentResult(null);
  };

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部导航 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t.home}
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              <span>{language === "en" ? t.chinese : t.english}</span>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* 支付成功提示 */}
        {paymentResult && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">
                    {t.paymentSuccess}
                  </h3>
                  <p className="text-sm text-green-600 mt-1">
                    {t.paymentSuccessDesc}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-0">
            <TabsTrigger value="plans" className="text-xs sm:text-sm">
              {t.plansTab}
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm">
              {t.paymentTab}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              {t.historyTab}
            </TabsTrigger>
          </TabsList>

          {/* 订阅计划 */}
          <TabsContent value="plans">
            <SubscriptionPlans
              onSelectPlan={handleSelectPlan}
              currentPlan={user.subscription_plan || "free"}
              currency={currency}
              onSwitchToPayment={() => setActiveTab("payment")}
              language={language}
            />
          </TabsContent>

          {/* 支付表单 */}
          <TabsContent value="payment">
            {selectedPlan ? (
              <div className="max-w-2xl mx-auto">
                <PaymentForm
                  planId={selectedPlan.planId}
                  billingCycle={selectedPlan.billingCycle}
                  amount={selectedPlan.amount}
                  currency={selectedPlan.currency}
                  description={selectedPlan.description}
                  userId={user.id}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  language={language}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {t.selectPlanFirst}
                    </p>
                    <Button
                      onClick={() => {
                        setActiveTab("plans");
                      }}
                    >
                      {t.choosePlan}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 账单历史 */}
          <TabsContent value="history">
            <BillingHistory userId={user.id} language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



