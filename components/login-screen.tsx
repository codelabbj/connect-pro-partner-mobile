"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Wallet, Loader2, ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const { theme } = useTheme()
  const { t } = useTranslation()
  const { login, isLoading } = useAuth()
  const { toast } = useToast()

  // Load remember me data on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    const rememberedPassword = localStorage.getItem("rememberedPassword")

    if (rememberedEmail && rememberedPassword) {
      setEmail(rememberedEmail)
      setPassword(rememberedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password)

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email)
        localStorage.setItem("rememberedPassword", password)
      } else {
        localStorage.removeItem("rememberedEmail")
        localStorage.removeItem("rememberedPassword")
      }

      onLogin()
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    }
  }

  // Forgot password handlers
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsProcessing(true)

    try {
      if (forgotPasswordStep === 1) {
        // Send OTP
        await sendOtp(forgotPasswordEmail)
        toast({
          title: t("forgotPassword.otpSent"),
          description: t("forgotPassword.otpSentDesc"),
        })
        setForgotPasswordStep(2)
      } else if (forgotPasswordStep === 2) {
        // Verify OTP (just advance to step 3 for now)
        setForgotPasswordStep(3)
      } else if (forgotPasswordStep === 3) {
        // Reset password
        if (newPassword !== confirmNewPassword) {
          setError("Passwords do not match")
          return
        }

        await resetPassword(otp, newPassword, confirmNewPassword)
        toast({
          title: t("forgotPassword.success"),
          description: t("forgotPassword.successDesc"),
        })

        // Reset form and return to login
        setIsForgotPassword(false)
        setForgotPasswordStep(1)
        setForgotPasswordEmail("")
        setOtp("")
        setNewPassword("")
        setConfirmNewPassword("")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const sendOtp = async (email: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/send_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to send OTP")
    }
  }

  const resetPassword = async (otp: string, newPassword: string, confirmNewPassword: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to reset password")
    }
  }

  // Forgot Password Form Component
  const ForgotPasswordForm = ({
    step,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    onSubmit,
    onBack,
    onBackToLogin,
    error,
    isProcessing
  }: {
    step: number
    email: string
    setEmail: (email: string) => void
    otp: string
    setOtp: (otp: string) => void
    newPassword: string
    setNewPassword: (password: string) => void
    confirmNewPassword: string
    setConfirmNewPassword: (password: string) => void
    onSubmit: (e: React.FormEvent) => void
    onBack: () => void
    onBackToLogin: () => void
    error: string
    isProcessing: boolean
  }) => {
    const renderStepContent = () => {
      switch (step) {
        case 1:
          return (
            <>
              <div className="text-center mb-8">
                <Mail className="w-14 h-14 text-blue-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {t("forgotPassword.enterEmail")}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t("forgotPassword.enterEmailDesc")}
                </p>
              </div>

              <div className="space-y-6">
                <Input
                  type="email"
                  placeholder={t("login.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 text-lg"
                  required
                  disabled={isProcessing}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBackToLogin}
                    className="flex-1 h-14 text-base"
                    disabled={isProcessing}
                  >
                    {t("forgotPassword.backToLogin")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isProcessing || !email}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("forgotPassword.sending")}
                      </div>
                    ) : (
                      t("forgotPassword.sendOtp")
                    )}
                  </Button>
                </div>
              </div>
            </>
          )

        case 2:
          return (
            <>
              <div className="text-center mb-8">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {t("forgotPassword.enterOtp")}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t("forgotPassword.enterOtpDesc")}
                </p>
              </div>

              <div className="space-y-6">
                <Input
                  type="text"
                  placeholder={t("forgotPassword.otpPlaceholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-16 text-lg text-center text-3xl tracking-widest"
                  maxLength={6}
                  required
                  disabled={isProcessing}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 h-14 text-base"
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t("forgotPassword.back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isProcessing || otp.length < 4}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("forgotPassword.verifying")}
                      </div>
                    ) : (
                      t("forgotPassword.verifyOtp")
                    )}
                  </Button>
                </div>
              </div>
            </>
          )

        case 3:
          return (
            <>
              <div className="text-center mb-8">
                <Lock className="w-14 h-14 text-purple-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {t("forgotPassword.newPassword")}
                </h3>
                <p className="text-base text-muted-foreground">
                  {t("forgotPassword.newPasswordDesc")}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder={t("forgotPassword.newPasswordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-16 text-lg"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="h-16 text-lg"
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 h-14 text-base"
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t("forgotPassword.back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isProcessing || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("forgotPassword.resetting")}
                      </div>
                    ) : (
                      t("forgotPassword.resetPassword")
                    )}
                  </Button>
                </div>
              </div>
            </>
          )

        default:
          return null
      }
    }

    return (
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 whitespace-pre-line">
            {error}
          </div>
        )}

        {renderStepContent()}
      </form>
    )
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
            <p className="text-muted-foreground text-base">{t("app.description")}</p>
          </div>
        </div>

        {/* Login Form or Forgot Password Form */}
        <div className="space-y-6">
          {isForgotPassword ? (
            <ForgotPasswordForm
              step={forgotPasswordStep}
              email={forgotPasswordEmail}
              setEmail={setForgotPasswordEmail}
              otp={otp}
              setOtp={setOtp}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              onSubmit={handleForgotPasswordSubmit}
              onBack={() => {
                if (forgotPasswordStep > 1) {
                  setForgotPasswordStep(forgotPasswordStep - 1)
                } else {
                  setIsForgotPassword(false)
                  setForgotPasswordEmail("")
                  setError("")
                }
              }}
              onBackToLogin={() => {
                setIsForgotPassword(false)
                setForgotPasswordStep(1)
                setForgotPasswordEmail("")
                setOtp("")
                setNewPassword("")
                setConfirmNewPassword("")
                setError("")
              }}
              error={error}
              isProcessing={isProcessing}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-base text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-900/20 dark:border-red-800 whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Input
                type="email"
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 text-lg border-border focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3 relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 text-lg border-border focus:ring-2 focus:ring-primary/50 focus:border-primary pr-14 transition-all duration-200 bg-input"
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

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("login.rememberMe")}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                onClick={() => {
                  setIsForgotPassword(true)
                  setForgotPasswordStep(1)
                  setError("")
                }}
                disabled={isLoading}
              >
                {t("login.forgotPassword")}
              </Button>
            </div>
          </form>
          )}
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
