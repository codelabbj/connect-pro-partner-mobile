"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Key,
  Eye,
  EyeOff,
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
import { bettingService } from "@/lib/betting-api"
import { BettingPlatform, VerifyUserIdResponse } from "@/lib/betting"
import { Gamepad2 } from "lucide-react"

interface BettingWithdrawalScreenProps {
  platformUid: string
  onNavigateBack: () => void
}

export function BettingWithdrawalScreen({ platformUid, onNavigateBack }: BettingWithdrawalScreenProps) {
  const [platform, setPlatform] = useState<BettingPlatform | null>(null)
  const [bettingUserId, setBettingUserId] = useState("")
  const [withdrawalCode, setWithdrawalCode] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<VerifyUserIdResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCode, setShowCode] = useState(false)
  
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { refreshAccountData, refreshTransactions } = useAuth()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  // Get platform image URL with priority resolution
  const getPlatformImageUrl = (platform: BettingPlatform | null) => {
    if (!platform) return null
    if (platform.external_image) {
      return platform.external_image
    }
    if (platform.logo) {
      if (platform.logo.startsWith('http://') || platform.logo.startsWith('https://')) {
        return platform.logo
      }
      return `${baseUrl}${platform.logo.startsWith('/') ? '' : '/'}${platform.logo}`
    }
    return null
  }

  // Load platform details
  const loadPlatform = async () => {
    try {
      const data = await bettingService.getPlatformDetail(platformUid)
      
      // Merge external data
      try {
        const externalData = await bettingService.getExternalPlatformData()
        const external = externalData.find(item => item.id === data.external_id)
        if (external) {
          const merged = {
            ...data,
            external_image: external.image,
            city: external.city,
            street: external.street,
          }
          setPlatform(merged)
        } else {
          setPlatform(data)
        }
      } catch (error) {
        console.warn('Failed to merge external data:', error)
        setPlatform(data)
      }
    } catch (error: any) {
      console.error('Failed to load platform:', error)
      toast({
        title: "Error",
        description: String(error?.message || 'Failed to load platform details'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verify betting user ID
  const verifyUserId = async () => {
    if (!bettingUserId.trim()) {
      toast({
        title: t("common.error"),
        description: t("betting.withdraw.errors.enterUserId"),
        variant: "destructive",
      })
      return
    }

    setVerifying(true)
    try {
      const response = await bettingService.verifyUserId({
        platform_uid: platformUid,
        betting_user_id: parseInt(bettingUserId)
      })
      
      if (response.UserId === 0) {
        toast({
          title: t("betting.withdraw.invalidUserIdTitle"),
          description: t("betting.withdraw.invalidUserIdDesc"),
          variant: "destructive",
        })
        setVerifiedUser(null)
      } else {
        setVerifiedUser(response)
        toast({
          title: t("betting.withdraw.userVerifiedTitle"),
          description: t("betting.withdraw.userVerifiedDesc", { name: response.Name }),
        })
      }
    } catch (error: any) {
      console.error('Failed to verify user ID:', error)
      toast({
        title: t("common.error"),
        description: String(error?.message || t("betting.withdraw.errors.verifyFailed")),
        variant: "destructive",
      })
      setVerifiedUser(null)
    } finally {
      setVerifying(false)
    }
  }

  // Submit withdrawal
  const submitWithdrawal = async () => {
    if (!verifiedUser) {
      toast({
        title: t("common.error"),
        description: t("betting.withdraw.errors.verifyFirst"),
        variant: "destructive",
      })
      return
    }

    if (!withdrawalCode.trim()) {
      toast({
        title: t("common.error"),
        description: t("betting.withdraw.errors.enterWithdrawalCode"),
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await bettingService.createWithdrawal({
        platform_uid: platformUid,
        betting_user_id: bettingUserId,
        withdrawal_code: withdrawalCode
      })

      toast({
        title: t("common.success"),
        description: response.message,
      })

      // Refresh dashboard data after successful transaction
      await Promise.all([
        refreshAccountData(),
        refreshTransactions(),
      ])

      // Reset form
      setBettingUserId("")
      setWithdrawalCode("")
      setVerifiedUser(null)

      // Navigate back after short delay
      setTimeout(() => {
        onNavigateBack()
      }, 2500)
    } catch (error: any) {
      console.error('Failed to create withdrawal:', error)
      toast({
        title: t("common.error"),
        description: String(error?.message || t("betting.withdraw.errors.createFailed")),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadPlatform()
  }, [platformUid])

  // Format currency
  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString()
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm opacity-70">{t("betting.withdraw.loadingPlatform")}</p>
        </div>
      </div>
    )
  }

  if (!platform) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("betting.withdraw.notFoundTitle")}</h2>
          <p className="text-sm opacity-70 mb-4">{t("betting.withdraw.notFoundDesc")}</p>
          <Button onClick={onNavigateBack}>{t("common.back")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <div className="px-4 pt-16 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className={`h-12 w-12 p-0 rounded-full ${
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {t("betting.withdraw.title", { name: platform.name })}
            </h1>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {t("betting.withdraw.subtitle")}
            </p>
          </div>
        </div>

        {/* Platform Info */}
        <Card className={`border-0 shadow-lg mb-6 ${
          theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                {getPlatformImageUrl(platform) ? (
                  <img src={getPlatformImageUrl(platform)!} alt={platform.name} className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <Gamepad2 className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {platform.name}
                </h3>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {t("betting.withdraw.platformInfo", { min: formatCurrency(platform.min_withdrawal_amount), max: formatCurrency(platform.max_withdrawal_amount) })}
                </p>
                {(platform.city || platform.street) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {platform.city && (
                      <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {t("betting.platforms.address.city", { city: platform.city })}
                      </span>
                    )}
                    {platform.street && (
                      <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {t("betting.platforms.address.street", { street: platform.street })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <div className="px-4">
        <Card className={`border-0 shadow-lg ${
          theme === "dark" ? "bg-gray-800/95" : "bg-white/95"
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Withdrawal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Betting User ID */}
            <div className="space-y-2">
              <Label htmlFor="userId" className={`text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                {t("betting.withdraw.userIdLabel")}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="userId"
                  type="number"
                  placeholder={t("betting.withdraw.userIdPlaceholder") as string}
                  value={bettingUserId}
                  onChange={(e) => setBettingUserId(e.target.value)}
                  className={`flex-1 h-12 text-base ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  }`}
                />
                <Button
                  onClick={verifyUserId}
                  disabled={verifying || !bettingUserId.trim()}
                  className="px-6 h-12 text-base"
                >
                  {verifying ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    t("betting.withdraw.verify")
                  )}
                </Button>
              </div>
            </div>

            {/* User Verification Status */}
            {verifiedUser && (
              <Alert className={`${
                theme === "dark" ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
              }`}>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <strong>{t("betting.withdraw.userVerifiedTitle")}:</strong> {verifiedUser.Name} (ID: {verifiedUser.UserId})
                </AlertDescription>
              </Alert>
            )}

            {/* Withdrawal Code */}
            <div className="space-y-2">
              <Label htmlFor="withdrawalCode" className={`text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                {t("betting.withdraw.withdrawalCodeLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="withdrawalCode"
                  type={showCode ? "text" : "password"}
                  placeholder={t("betting.withdraw.withdrawalCodePlaceholder") as string}
                  value={withdrawalCode}
                  onChange={(e) => setWithdrawalCode(e.target.value)}
                  className={`pr-12 h-12 text-base ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-200 text-gray-900"
                  }`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t("betting.withdraw.withdrawalCodeHint")}
              </p>
            </div>

            {/* Important Notice */}
            <Alert className={`${
              theme === "dark" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"
            }`}>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>Important:</strong> Make sure you have the correct withdrawal code from the betting platform before proceeding.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={submitWithdrawal}
              disabled={submitting || !verifiedUser || !withdrawalCode.trim()}
              className="w-full h-14 bg-red-500 hover:bg-red-600 text-white text-base"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                  {t("betting.withdraw.creating")}
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 mr-3" />
                  {t("betting.withdraw.createButton")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
