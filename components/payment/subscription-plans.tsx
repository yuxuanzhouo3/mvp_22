"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Sparkles, Star } from "lucide-react";
import { getAmountByCurrency } from "@/lib/payment/payment-config";
import { SUBSCRIPTION_TIERS, getAvailableModelsForTier, type SubscriptionTier } from "@/lib/subscription-tiers";

const translations = {
  en: {
    // 等级名称
    free: "Free",
    basic: "Basic",
    pro: "Professional",
    premium: "Premium",

    // 等级描述
    freeDesc: "Basic features for getting started",
    basicDesc: "Enhanced features with better AI models",
    proDesc: "Professional-grade AI models and features",
    premiumDesc: "Ultimate AI models with unlimited usage",

    // 功能特性
    basicCodeGeneration: "Basic code generation",
    enhancedCodeGeneration: "Enhanced code generation",
    professionalCodeGeneration: "Professional code generation",
    ultimateCodeGeneration: "Ultimate code generation",
    limitedRequests: "Limited requests",
    moreRequests: "More requests",
    unlimitedRequests: "Unlimited requests",
    standardSupport: "Standard support",
    prioritySupport: "Priority support",
    dedicatedSupport: "Dedicated support",

    // 模型相关
    aiModels: "AI Models",
    deepseekChat: "DeepSeek Chat",
    deepseekCoder: "DeepSeek Coder",
    gpt4: "GPT-4",
    gpt4Turbo: "GPT-4 Turbo",
    claude3Sonnet: "Claude 3 Sonnet",
    claude3Opus: "Claude 3 Opus",

    // 其他
    requestsPerDay: "requests/day",
    requestsPerMonth: "requests/month",
    unlimited: "Unlimited",
    mostPopular: "Most Popular",
    active: "Active",
    getStarted: "Get Started",
    renew: "Renew",
    upgrade: "Upgrade",
    choosePlan: "Choose Plan",
    month: "month",
    year: "year",
    save: "Save",
    save20: "Save 20%",
    save50: "Save 50%",
  },
  zh: {
    // 等级名称
    free: "免费版",
    basic: "基础版",
    pro: "专业版",
    premium: "旗舰版",

    // 等级描述
    freeDesc: "基础功能，适合初次尝试",
    basicDesc: "增强功能，更好的AI模型",
    proDesc: "专业级AI模型和功能",
    premiumDesc: "最强大的AI模型和无限使用",

    // 功能特性
    basicCodeGeneration: "基础代码生成",
    enhancedCodeGeneration: "增强代码生成",
    professionalCodeGeneration: "专业级代码生成",
    ultimateCodeGeneration: "旗舰级代码生成",
    limitedRequests: "请求次数有限",
    moreRequests: "更多请求次数",
    unlimitedRequests: "无限请求次数",
    standardSupport: "标准支持",
    prioritySupport: "优先支持",
    dedicatedSupport: "专属支持",

    // 模型相关
    aiModels: "AI模型",
    deepseekChat: "DeepSeek Chat",
    deepseekCoder: "DeepSeek Coder",
    gpt4: "GPT-4",
    gpt4Turbo: "GPT-4 Turbo",
    claude3Sonnet: "Claude 3 Sonnet",
    claude3Opus: "Claude 3 Opus",

    // 其他
    requestsPerDay: "次/天",
    requestsPerMonth: "次/月",
    unlimited: "无限",
    mostPopular: "最受欢迎",
    active: "活跃",
    getStarted: "开始使用",
    renew: "续费",
    upgrade: "升级",
    choosePlan: "选择套餐",
    month: "月",
    year: "年",
    save: "节省",
    save20: "节省20%",
    save50: "节省50%",
  },
};

interface SubscriptionPlansProps {
  onSelectPlan: (planId: string, billingCycle: "monthly" | "yearly") => void;
  currentPlan?: string;
  currency?: string;
  onSwitchToPayment?: () => void;
  language?: "en" | "zh";
}

export function SubscriptionPlans({
  onSelectPlan,
  currentPlan,
  currency = "USD",
  onSwitchToPayment,
  language = "en",
}: SubscriptionPlansProps) {
  const t = translations[language];
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // 从SUBSCRIPTION_TIERS生成plans数据
  const allPlans = Object.values(SUBSCRIPTION_TIERS).map((tier) => {
    const models = getAvailableModelsForTier(tier.id);
    const modelNames = models.map(model => {
      switch (model.id) {
        case 'deepseek-chat': return t.deepseekChat;
        case 'deepseek-coder': return t.deepseekCoder;
        case 'gpt-4': return t.gpt4;
        case 'gpt-4-turbo': return t.gpt4Turbo;
        case 'claude-3-sonnet': return t.claude3Sonnet;
        case 'claude-3-opus': return t.claude3Opus;
        default: return model.name;
      }
    });

    const features = [
      ...tier.features.map(feature => {
        switch (feature) {
          case '基础代码生成': return t.basicCodeGeneration;
          case '增强代码生成': return t.enhancedCodeGeneration;
          case '专业级代码生成': return t.professionalCodeGeneration;
          case '旗舰级代码生成': return t.ultimateCodeGeneration;
          case '有限请求次数': return t.limitedRequests;
          case '更多请求次数': return t.moreRequests;
          case '无限请求次数': return t.unlimitedRequests;
          case '标准支持': return t.standardSupport;
          case '优先支持': return t.prioritySupport;
          case '专属支持': return t.dedicatedSupport;
          default: return feature;
        }
      }),
      `${t.aiModels}: ${modelNames.join(', ')}`,
      tier.limits.requestsPerDay === -1
        ? `${t.unlimitedRequests}`
        : `${tier.limits.requestsPerDay} ${t.requestsPerDay}`
    ];

    const getTierIcon = (tierId: string) => {
      switch (tierId) {
        case 'free': return <Zap className="h-6 w-6" />;
        case 'basic': return <Check className="h-6 w-6" />;
        case 'pro': return <Crown className="h-6 w-6" />;
        case 'premium': return <Star className="h-6 w-6 text-yellow-500" />;
        default: return <Zap className="h-6 w-6" />;
      }
    };

    const getTierDescription = (tierId: string) => {
      switch (tierId) {
        case 'free': return t.freeDesc;
        case 'basic': return t.basicDesc;
        case 'pro': return t.proDesc;
        case 'premium': return t.premiumDesc;
        default: return tier.description;
      }
    };

    return {
      id: tier.id,
      name: t[tier.id as keyof typeof t] || tier.name,
      description: getTierDescription(tier.id),
      price: selectedBillingCycle === "monthly" ? tier.price.monthly : tier.price.yearly,
      billingCycle: selectedBillingCycle,
      currency: currency,
      features,
      icon: getTierIcon(tier.id),
      popular: tier.id === 'pro',
      isPaid: tier.price.monthly > 0,
      limits: tier.limits
    };
  });

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return t.free;
    return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0 || yearlyPrice === 0) return 0;
    const monthlyYearCost = monthlyPrice * 12;
    const savings = monthlyYearCost - yearlyPrice;
    return Math.round((savings / monthlyYearCost) * 100);
  };

  return (
    <div className="space-y-6">
      {/* 账单周期切换 */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setSelectedBillingCycle("monthly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedBillingCycle === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.month}
          </button>
          <button
            onClick={() => setSelectedBillingCycle("yearly")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedBillingCycle === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.year}
            {selectedBillingCycle === "yearly" && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                {t.save} 17%
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
        {allPlans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const savings = plan.yearlyPrice ? calculateSavings(plan.price, plan.yearlyPrice) : 0;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    {t.mostPopular}
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {t.active}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">{plan.icon}</div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-4">
                  {plan.isPaid ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-3xl font-bold">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.billingCycle === "monthly" ? t.month : t.year}
                        </span>
                      </div>
                      {plan.yearlyPrice && plan.yearlyPrice > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            {formatPrice(plan.yearlyPrice, plan.currency)}/{t.year}
                          </span>
                          {savings > 0 && (
                            <span className="text-green-600 font-semibold ml-2">
                              {t.save} {savings}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">{t.free}</span>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => {
                    onSelectPlan(plan.id, selectedBillingCycle);
                    if (onSwitchToPayment && plan.isPaid) {
                      setTimeout(() => onSwitchToPayment(), 100);
                    }
                  }}
                  disabled={!plan.isPaid && plan.id === 'free'}
                >
                  {plan.id === 'free'
                    ? t.getStarted
                    : isCurrentPlan
                    ? t.renew
                    : currentPlan && currentPlan !== 'free' && plan.id !== currentPlan
                    ? t.upgrade
                    : t.choosePlan}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



