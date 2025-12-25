"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Sparkles, Github, Unlink, ExternalLink, Loader2, Crown, Zap, Star } from "lucide-react"
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscription-tiers"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}

function ProfilePageContent() {
  const { user, session } = useAuth()
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [isEditing, setIsEditing] = useState(false)

  // GitHub integration state
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isUnbinding, setIsUnbinding] = useState(false)

  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  if (!user) return null

  // Load subscription information
  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      if (!session?.access_token) return

      try {
        setIsLoadingSubscription(true)

        // 检查 Supabase 是否配置（通过 API 获取环境变量）
        try {
          const envResponse = await fetch('/api/env')
          if (envResponse.ok) {
            const env = await envResponse.json()
            const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
            if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
              console.warn('Supabase not configured, using mock subscription data')
              // 模拟数据用于演示
              setSubscriptionTier('free')
              setSubscriptionStatus('inactive')
              setSubscriptionEndDate(null)
              setIsLoadingSubscription(false)
              return
            }
          }
        } catch (error) {
          console.warn('Failed to fetch env, using default check:', error)
        }

        const response = await fetch('/api/user/subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSubscriptionTier(data.subscription.tier || 'free')
          setSubscriptionStatus(data.subscription.status || 'inactive')
          setSubscriptionEndDate(data.subscription.currentPeriodEnd)
        } else {
          console.error('Failed to load subscription info:', response.status)
          setSubscriptionTier('free')
          setSubscriptionStatus('inactive')
          setSubscriptionEndDate(null)
        }
      } catch (error) {
        console.error('Error loading subscription info:', error)
        setSubscriptionTier('free')
        setSubscriptionStatus('inactive')
        setSubscriptionEndDate(null)
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    loadSubscriptionInfo()
  }, [session])

  // Check GitHub connection status
  useEffect(() => {
    const checkGithubStatus = async () => {
      if (!session?.access_token) {
        setGithubConnected(false)
        setGithubUsername(null)
        return
      }

      try {
        const response = await fetch('/api/github/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setGithubConnected(data.connected)
          setGithubUsername(data.username || null)
        } else {
          setGithubConnected(false)
          setGithubUsername(null)
        }
      } catch (error) {
        console.error('Error checking GitHub status:', error)
        setGithubConnected(false)
        setGithubUsername(null)
      }
    }
    checkGithubStatus()
  }, [session])

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSubscriptionIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return <Zap className="h-3 w-3" />
      case 'basic': return <Sparkles className="h-3 w-3" />
      case 'pro': return <Crown className="h-3 w-3" />
      case 'premium': return <Star className="h-3 w-3" />
      default: return <Zap className="h-3 w-3" />
    }
  }

  const getSubscriptionColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getSubscriptionDisplayName = (tier: SubscriptionTier) => {
    const tierNames = {
      free: language === "en" ? "Free" : "免费版",
      basic: language === "en" ? "Basic" : "基础版",
      pro: language === "en" ? "Professional" : "专业版",
      premium: language === "en" ? "Premium" : "旗舰版",
    }
    return tierNames[tier] || tierNames.free
  }

  const handleConnectGithub = async () => {
    if (!session?.access_token) {
      alert(language === "en" ? "Please log in first" : "请先登录")
      return
    }

    // 如果已经连接了 GitHub，提示用户需要先解绑
    if (githubConnected) {
      const confirmMessage = language === "en"
        ? `You are already connected to GitHub as @${githubUsername}. To connect a different account, you need to unbind first. Would you like to unbind now?`
        : `您已经连接到 GitHub 账户 @${githubUsername}。要连接其他账户，需要先解绑当前账户。要现在解绑吗？`

      const shouldUnbind = confirm(confirmMessage)
      if (shouldUnbind) {
        await handleUnbindGithub()
        return
      } else {
        return
      }
    }

    setIsGithubLoading(true)
    try {
      const response = await fetch('/api/github/auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          window.open(data.authUrl, '_blank')
        } else if (data.setupUrl) {
          alert(data.message || (language === "en" ? "GitHub OAuth not configured." : "GitHub OAuth 未配置。"))
          window.open(data.setupUrl, '_blank')
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || (language === "en" ? "Failed to connect GitHub" : "连接 GitHub 失败"))
      }
    } catch (error: any) {
      console.error('Error connecting GitHub:', error)
      alert(language === "en" ? `Failed to connect GitHub: ${error.message}` : `连接 GitHub 失败: ${error.message}`)
    } finally {
      setIsGithubLoading(false)
    }
  }



  const handleUnbindGithub = async () => {
    if (!session?.access_token) {
      alert(language === "en" ? "Please log in first" : "请先登录")
      return
    }

    if (!confirm(language === "en"
      ? "Are you sure you want to unbind your GitHub account? This will remove your ability to push code to GitHub."
      : "确定要解绑 GitHub 账户吗？这将移除您推送到 GitHub 的能力。")) {
      return
    }

    setIsUnbinding(true)
    try {
      const response = await fetch('/api/github/unbind', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGithubConnected(false)
        setGithubUsername(null)
        alert(language === "en" ? "GitHub account unbound successfully" : "GitHub 账户解绑成功")
      } else {
        const errorData = await response.json()
        alert(errorData.error || (language === "en" ? "Failed to unbind GitHub account" : "解绑 GitHub 账户失败"))
      }
    } catch (error: any) {
      console.error('Error unbinding GitHub:', error)
      alert(language === "en" ? `Failed to unbind GitHub: ${error.message}` : `解绑 GitHub 失败: ${error.message}`)
    } finally {
      setIsUnbinding(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} setLanguage={setLanguage} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              {language === "en" ? "Profile" : "个人资料"}
            </h1>
            {!isLoadingSubscription && (
              <Badge variant="secondary" className={`flex items-center gap-1 ${getSubscriptionColor(subscriptionTier)}`}>
                {getSubscriptionIcon(subscriptionTier)}
                {getSubscriptionDisplayName(subscriptionTier)}
                {subscriptionStatus === 'active' && subscriptionEndDate && (
                  <span className="text-xs ml-1">
                    ({language === "en" ? "Active" : "活跃"})
                  </span>
                )}
              </Badge>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Overview */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src="" alt={user.email || ""} />
                  <AvatarFallback className="text-2xl bg-accent">
                    {getUserInitials(user.email || "")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {user.user_metadata?.full_name || "User"}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {language === "en" ? "Joined" : "加入时间"}: {formatDate(user.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {language === "en" ? "Last sign in" : "最后登录"}: {formatDate(user.last_sign_in_at || user.created_at)}
                    </span>
                  </div>
                  {!isLoadingSubscription && subscriptionStatus === 'active' && subscriptionEndDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {language === "en" ? "Subscription ends" : "订阅到期"}: {formatDate(subscriptionEndDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {language === "en" ? "Account Settings" : "账户设置"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Manage your account information and preferences"
                    : "管理您的账户信息和偏好设置"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {language === "en" ? "Full Name" : "全名"}
                  </Label>
                  <Input
                    id="fullName"
                    defaultValue={user.user_metadata?.full_name || ""}
                    placeholder={language === "en" ? "Enter your full name" : "输入您的全名"}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === "en" ? "Email" : "邮箱"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Email cannot be changed. Contact support if needed."
                      : "邮箱无法修改。如需修改请联系支持。"}
                  </p>
                </div>

                {/* GitHub Integration */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    {language === "en" ? "GitHub Integration" : "GitHub 集成"}
                  </Label>

                  {githubConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Github className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              {language === "en" ? "Connected" : "已连接"}
                            </p>
                            {githubUsername && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                @{githubUsername}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://github.com/${githubUsername}`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {language === "en" ? "View Profile" : "查看资料"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUnbindGithub}
                          disabled={isUnbinding}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          {isUnbinding ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Unlink className="h-3 w-3" />
                          )}
                          {language === "en" ? "Unbind" : "解绑"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <Github className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {language === "en" ? "Not Connected" : "未连接"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {language === "en"
                                ? "Connect your GitHub account to push code to repositories"
                                : "连接您的 GitHub 账户以推送到代码仓库"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleConnectGithub}
                        disabled={isGithubLoading}
                        className="flex items-center gap-2"
                      >
                        {isGithubLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Github className="h-4 w-4" />
                        )}
                        {language === "en" ? "Connect GitHub Account" : "连接 GitHub 账户"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === "en"
                          ? "Each user can connect one GitHub account at a time. To switch accounts, unbind first."
                          : "每个用户同时只能连接一个 GitHub 账户。要切换账户，请先解绑。"}
                      </p>
                    </div>
                  )}
                </div>



                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                  >
                    {isEditing
                      ? (language === "en" ? "Cancel" : "取消")
                      : (language === "en" ? "Edit Profile" : "编辑资料")}
                  </Button>
                  {isEditing && (
                    <Button>
                      {language === "en" ? "Save Changes" : "保存更改"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "en" ? "Usage Statistics" : "使用统计"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Your CodeGen AI usage this month"
                  : "本月 CodeGen AI 使用情况"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold text-accent">24</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "en" ? "Components Generated" : "已生成组件"}
                  </div>
                </div>
                <div className="text-center p-4 bg-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold text-accent">156</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "en" ? "Lines of Code" : "代码行数"}
                  </div>
                </div>
                <div className="text-center p-4 bg-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold text-accent">8</div>
                  <div className="text-sm text-muted-foreground">
                    {language === "en" ? "Projects Created" : "已创建项目"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}



