"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Wallet, Loader2 } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      await login(email, password)
      onLogin()
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 safe-area-inset ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
      }`}
    >
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        {/* Logo and Brand */}
        <div className="text-center space-y-6">
          
          <div className="space-y-2">
          <div className="flex justify-center">
          <div className="relative">
          <img src="/logo.png" alt="Connect Pro Logo" className="h-23 w-23" />
          </div>
          </div>
            {/* <h1 className="text-3xl font-bold text-foreground text-balance tracking-tight">{t("app.name")}</h1> */}
            {/* <p className="text-md font-semibold text-primary">{t("app.subtitle")}</p> */}
            <p className="text-muted-foreground text-sm">{t("app.description")}</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 whitespace-pre-line">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base border-border focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-base border-border focus:ring-2 focus:ring-primary/50 focus:border-primary pr-14 transition-all duration-200 bg-input"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                t("login.signIn")
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t("login.forgotPassword")}
            </Button>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>{t("footer.secure")}</span>
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>{t("footer.trusted")}</span>
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>{t("footer.professional")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("footer.encryption")}</p>
        </div> */}
      </div>
    </div>
  )
}
