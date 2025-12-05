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
import { User, Mail, Calendar, Sparkles } from "lucide-react"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}

function ProfilePageContent() {
  const { user } = useAuth()
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

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

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} setLanguage={setLanguage} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              {language === "en" ? "Profile" : "个人资料"}
            </h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {language === "en" ? "Premium User" : "高级用户"}
            </Badge>
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



