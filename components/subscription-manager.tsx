"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, Check, Star, ArrowUp, Calendar, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SUBSCRIPTION_TIERS, getAvailableModelsForTier, type SubscriptionTier } from "@/lib/subscription-tiers";

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  requestsToday: number;
  requestsThisMonth: number;
  limits: {
    requestsPerDay: number;
    requestsPerMonth: number;
  };
}

const translations = {
  en: {
    currentPlan: "Current Plan",
    upgradePlan: "Upgrade Plan",
    manageSubscription: "Manage Subscription",
    usageStats: "Usage Statistics",
    requestsToday: "Requests Today",
    requestsThisMonth: "Requests This Month",
    unlimited: "Unlimited",
    active: "Active",
    inactive: "Inactive",
    expired: "Expired",
    nextBilling: "Next Billing",
    availableModels: "Available Models",
    upgradeToAccess: "Upgrade to access premium models",
    loading: "Loading...",
    error: "Error loading subscription data",
    upgradeNow: "Upgrade Now",
    viewPlans: "View Plans",
  },
  zh: {
    currentPlan: "当前套餐",
    upgradePlan: "升级套餐",
    manageSubscription: "管理订阅",
    usageStats: "使用统计",
    requestsToday: "今日请求",
    requestsThisMonth: "本月请求",
    unlimited: "无限",
    active: "活跃",
    inactive: "未激活",
    expired: "已过期",
    nextBilling: "下次账单",
    availableModels: "可用模型",
    upgradeToAccess: "升级以访问高级模型",
    loading: "加载中...",
    error: "加载订阅数据时出错",
    upgradeNow: "立即升级",
    viewPlans: "查看套餐",
  },
};

export function SubscriptionManager({
  onUpgradeClick,
  language = "en"
}: {
  onUpgradeClick?: () => void;
  language?: "en" | "zh";
}) {
  const { user, session } = useAuth();
  const t = translations[language];
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && session) {
      loadSubscriptionData();
    }
  }, [user, session]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: 从实际API获取订阅数据
      // 暂时使用模拟数据
      const mockData: SubscriptionData = {
        tier: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        requestsToday: 3,
        requestsThisMonth: 45,
        limits: {
          requestsPerDay: 10,
          requestsPerMonth: 100
        }
      };

      setSubscriptionData(mockData);
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Zap className="h-5 w-5" />;
      case 'basic': return <Check className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
      case 'premium': return <Star className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  const calculateProgress = (current: number, limit: number) => {
    if (limit === -1) return 0; // 无限制
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>{t.loading}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscriptionData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error || t.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSubscriptionData}
              className="mt-2"
            >
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = SUBSCRIPTION_TIERS[subscriptionData.tier];
  const availableModels = getAvailableModelsForTier(subscriptionData.tier);
  const nextTier = SUBSCRIPTION_TIERS['basic']; // 临时设为basic，可以根据当前等级动态计算

  return (
    <div className="space-y-4">
      {/* 当前订阅状态 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTierIcon(subscriptionData.tier)}
              <CardTitle>{t.currentPlan}</CardTitle>
            </div>
            <Badge className={getStatusColor(subscriptionData.status)}>
              {t[subscriptionData.status as keyof typeof t] || subscriptionData.status}
            </Badge>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Badge className={getTierColor(subscriptionData.tier)}>
                {currentTier.name}
              </Badge>
              <span>•</span>
              <span>{t.nextBilling}: {formatDate(subscriptionData.currentPeriodEnd)}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 使用统计 */}
            <div className="space-y-3">
              <h4 className="font-medium">{t.usageStats}</h4>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.requestsToday}</span>
                  <span>
                    {subscriptionData.requestsToday} / {
                      subscriptionData.limits.requestsPerDay === -1
                        ? t.unlimited
                        : subscriptionData.limits.requestsPerDay
                    }
                  </span>
                </div>
                <Progress
                  value={calculateProgress(subscriptionData.requestsToday, subscriptionData.limits.requestsPerDay)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.requestsThisMonth}</span>
                  <span>
                    {subscriptionData.requestsThisMonth} / {
                      subscriptionData.limits.requestsPerMonth === -1
                        ? t.unlimited
                        : subscriptionData.limits.requestsPerMonth
                    }
                  </span>
                </div>
                <Progress
                  value={calculateProgress(subscriptionData.requestsThisMonth, subscriptionData.limits.requestsPerMonth)}
                  className="h-2"
                />
              </div>
            </div>

            {/* 可用模型 */}
            <div className="space-y-3">
              <h4 className="font-medium">{t.availableModels}</h4>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <div key={model.id} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{model.name}</span>
                  </div>
                ))}
              </div>

              {subscriptionData.tier === 'free' && (
                <div className="text-xs text-muted-foreground mt-2">
                  {t.upgradeToAccess}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 升级选项 */}
      {subscriptionData.tier !== 'premium' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              {t.upgradePlan}
            </CardTitle>
            <CardDescription>
              升级到 {nextTier.name} 以解锁更多功能和更好的AI模型
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={onUpgradeClick}>
                {t.upgradeNow}
              </Button>
              <Button variant="outline">
                {t.viewPlans}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
















