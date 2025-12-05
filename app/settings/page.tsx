"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Bell, Shield, Palette, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  )
}

function SettingsPageContent() {
  const { user } = useAuth()
  const [language, setLanguage] = useState<"en" | "zh">("en")

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    theme: "system",
    language: "en",
    autoSave: true,
    codePreview: true,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} setLanguage={setLanguage} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8" />
            <h1 className="text-3xl font-bold">
              {language === "en" ? "Settings" : "设置"}
            </h1>
          </div>

          <div className="grid gap-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {language === "en" ? "Notifications" : "通知"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Manage your notification preferences"
                    : "管理您的通知偏好设置"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      {language === "en" ? "Email Notifications" : "邮件通知"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Receive notifications about your account and projects"
                        : "接收关于账户和项目的通知"}
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">
                      {language === "en" ? "Push Notifications" : "推送通知"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Receive push notifications in your browser"
                        : "在浏览器中接收推送通知"}
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {language === "en" ? "Appearance" : "外观"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Customize the look and feel of the application"
                    : "自定义应用程序的外观和感觉"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">
                    {language === "en" ? "Theme" : "主题"}
                  </Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        {language === "en" ? "Light" : "浅色"}
                      </SelectItem>
                      <SelectItem value="dark">
                        {language === "en" ? "Dark" : "深色"}
                      </SelectItem>
                      <SelectItem value="system">
                        {language === "en" ? "System" : "系统"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">
                    {language === "en" ? "Language" : "语言"}
                  </Label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Code Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {language === "en" ? "Code Generation" : "代码生成"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Configure your code generation preferences"
                    : "配置您的代码生成偏好设置"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">
                      {language === "en" ? "Auto-save Projects" : "自动保存项目"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Automatically save your projects as you work"
                        : "在您工作时自动保存项目"}
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting("autoSave", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="code-preview">
                      {language === "en" ? "Live Code Preview" : "实时代码预览"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Show live preview when generating code"
                        : "生成代码时显示实时预览"}
                    </p>
                  </div>
                  <Switch
                    id="code-preview"
                    checked={settings.codePreview}
                    onCheckedChange={(checked) => updateSetting("codePreview", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  {language === "en" ? "Danger Zone" : "危险区域"}
                </CardTitle>
                <CardDescription>
                  {language === "en"
                    ? "Irreversible actions that affect your account"
                    : "影响您账户的不可逆转操作"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {language === "en"
                      ? "These actions cannot be undone. Please proceed with caution."
                      : "这些操作无法撤销。请谨慎操作。"}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    {language === "en" ? "Export Data" : "导出数据"}
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    {language === "en" ? "Delete Account" : "删除账户"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button>
                {language === "en" ? "Save Changes" : "保存更改"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



