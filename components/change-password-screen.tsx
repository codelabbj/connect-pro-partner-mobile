"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"

interface ChangePasswordScreenProps {
  onNavigateBack: () => void
}

export function ChangePasswordScreen({ onNavigateBack }: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { theme, resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!currentPassword) {
      setError("Current password is required")
      return
    }

    if (!newPassword) {
      setError("New password is required")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
        body: JSON.stringify({
          password: currentPassword,
          newpassword: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      toast({
        title: t("changePassword.success"),
        description: t("changePassword.successDesc"),
      })

      // Clear form and navigate back
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        onNavigateBack()
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        resolvedTheme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 rounded-full ${
              resolvedTheme === "dark"
                ? "text-gray-300 hover:bg-gray-700/50"
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
              {t("changePassword.title")}
            </h1>
            <p className={`text-base ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {t("changePassword.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 safe-area-inset-bottom">
        <Card
          className={`border-0 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            resolvedTheme === "dark" ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-900"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="w-6 h-6" />
              {t("changePassword.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-base text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-3">
                <label className="text-base font-medium">
                  {t("changePassword.currentPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-16 text-lg border-border focus:ring-2 focus:ring-primary/50 focus:border-primary pr-14"
                    placeholder={t("changePassword.currentPasswordPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-3">
                <label className="text-base font-medium">
                  {t("changePassword.newPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-16 text-lg border-border focus:ring-2 focus:ring-primary/50 focus:border-primary pr-14"
                    placeholder={t("changePassword.newPasswordPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-3">
                <label className="text-base font-medium">
                  {t("changePassword.confirmPassword")}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-16 text-lg border-border focus:ring-2 focus:ring-primary/50 focus:border-primary pr-14"
                    placeholder={t("changePassword.confirmPasswordPlaceholder")}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("changePassword.updating")}
                  </div>
                ) : (
                  t("changePassword.updatePassword")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
