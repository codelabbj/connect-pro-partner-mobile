"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  ChevronLeft,
  Loader2,
  Check,
  XCircle
} from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
import { bettingService } from "@/lib/betting-api"
import { BettingPlatform, VerifyUserIdResponse } from "@/lib/betting"

interface BettingDepositScreenProps {
  platformUid: string
  onNavigateBack: () => void
  onSuccess?: () => void
}

export function BettingDepositScreen({ platformUid, onNavigateBack, onSuccess }: BettingDepositScreenProps) {
  const [step, setStep] = useState(1) // 1: User ID, 2: Amount
  const [platform, setPlatform] = useState<BettingPlatform | null>(null)
  const [bettingUserId, setBettingUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<VerifyUserIdResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme || "light"
  const { t } = useTranslation()
  const { toast } = useToast()
  const { refreshAccountData, refreshTransactions } = useAuth()

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  const getPlatformImageUrl = (platform: BettingPlatform | null) => {
    if (!platform) return null
    if (platform.external_image) return platform.external_image
    if (platform.logo) {
      if (platform.logo.startsWith('http://') || platform.logo.startsWith('https://')) {
        return platform.logo
      }
      return `${baseUrl}${platform.logo.startsWith('/') ? '' : '/'}${platform.logo}`
    }
    return null
  }

  const loadPlatform = async () => {
    try {
      const data = await bettingService.getPlatformDetail(platformUid)
      try {
        const externalData = await bettingService.getExternalPlatformData()
        const external = externalData.find(item => item.id === data.external_id)
        if (external) {
          setPlatform({
            ...data,
            external_image: external.image,
            city: external.city,
            street: external.street,
          })
        } else {
          setPlatform(data)
        }
      } catch (error) {
        setPlatform(data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: String(error?.message || 'Failed to load platform details'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyUserId = async () => {
    if (!bettingUserId.trim()) {
      toast({
        title: t("common.error"),
        description: t("betting.deposit.errors.enterUserId"),
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
          title: t("betting.deposit.invalidUserIdTitle"),
          description: t("betting.deposit.invalidUserIdDesc"),
          variant: "destructive",
        })
        setVerifiedUser(null)
      } else {
        setVerifiedUser(response)
        setStep(2) // Move to next step on success
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: String(error?.message || t("betting.deposit.errors.verifyFailed")),
        variant: "destructive",
      })
      setVerifiedUser(null)
    } finally {
      setVerifying(false)
    }
  }

  const handleCreateDeposit = async () => {
    if (!verifiedUser) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: t("common.error"),
        description: t("betting.deposit.errors.enterAmount"),
        variant: "destructive",
      })
      return
    }

    if (platform && amountNum < parseFloat(platform.min_deposit_amount)) {
      toast({
        title: t("common.error"),
        description: t("betting.deposit.errors.minAmount", { min: parseFloat(platform.min_deposit_amount).toLocaleString() }),
        variant: "destructive",
      })
      return
    }

    if (platform && amountNum > parseFloat(platform.max_deposit_amount)) {
      toast({
        title: t("common.error"),
        description: t("betting.deposit.errors.maxAmount", { max: parseFloat(platform.max_deposit_amount).toLocaleString() }),
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      await bettingService.createDeposit({
        platform_uid: platformUid,
        betting_user_id: bettingUserId,
        amount: amount
      })

      // Show the beautiful success toast
      setShowSuccessToast(true)

      // Refresh data
      await Promise.all([
        refreshAccountData(),
        refreshTransactions(),
      ])

      setTimeout(() => {
        setShowSuccessToast(false)
        if (onSuccess) onSuccess()
        else onNavigateBack()
      }, 3500)

    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: String(error?.message || t("betting.deposit.errors.createFailed")),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadPlatform()
  }, [platformUid])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!platform) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("betting.deposit.notFoundTitle")}</h2>
          <Button onClick={onNavigateBack}>{t("common.back")}</Button>
        </div>
      </div>
    )
  }

  const platformLogo = getPlatformImageUrl(platform)

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>

      {/* 1. PREMIUM MESH BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -right-[10%] w-[70%] h-[50%] rounded-[100%] opacity-20 blur-[120px] animate-pulse ${theme === "dark" ? "bg-blue-500" : "bg-blue-300"}`} style={{ animationDuration: '8s' }} />
        <div className={`absolute top-[20%] -left-[10%] w-[60%] h-[40%] rounded-[100%] opacity-10 blur-[100px] animate-pulse ${theme === "dark" ? "bg-purple-500" : "bg-purple-200"}`} style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className={`absolute -bottom-[10%] right-[20%] w-[50%] h-[40%] rounded-[100%] opacity-15 blur-[110px] animate-pulse ${theme === "dark" ? "bg-emerald-500" : "bg-emerald-200"}`} style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* 2. CUSTOM SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed top-8 left-0 right-0 z-[100] px-4 animate-in slide-in-from-top duration-500">
          <div className={`max-w-md mx-auto p-4 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] border flex items-center gap-4 ${theme === "dark" ? "bg-slate-800/90 border-slate-700/50 backdrop-blur-xl" : "bg-white/90 border-slate-100 backdrop-blur-xl"}`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h3 className={`font-black text-lg ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Dépôt Réussi</h3>
              <p className={`text-sm font-medium leading-tight ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Vous avez déposé {amount} F sur le compte {bettingUserId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. STEP PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 flex gap-1 px-1 pt-1 safe-area-inset-top">
        <div className={`h-full flex-1 rounded-full transition-all duration-700 ${step >= 1 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-200 dark:bg-slate-800"}`} />
        <div className={`h-full flex-1 rounded-full transition-all duration-700 ${step >= 2 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-200 dark:bg-slate-800"}`} />
      </div>

      {/* 4. HEADER */}
      <div className="p-4 flex items-center justify-between z-10 relative mt-2 safe-area-inset-top">
        <Button variant="ghost" size="sm" onClick={step === 2 ? () => setStep(1) : onNavigateBack} className={`h-11 w-11 p-0 rounded-2xl transition-all active:scale-90 ${theme === "dark" ? "text-slate-300 hover:bg-slate-800/80 bg-slate-800/40" : "text-slate-600 bg-white/80 hover:bg-white shadow-sm border border-slate-100"}`}>
          {step === 2 ? <ChevronLeft className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
        </Button>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Dépôt de paris - {platform.name}</p>
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${theme === "dark" ? "bg-slate-800/40" : "bg-white/80 shadow-sm border border-slate-100"}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        </div>
      </div>

      {/* 5. STEP 1: USER ID */}
      {step === 1 && (
        <div className="flex flex-col h-[calc(100vh-100px)] px-6 pt-10 z-10 relative">
          <h1 className={`text-center text-4xl font-black tracking-tighter mb-12 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Déposer</h1>
          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <label className={`text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>ID Utilisateur de paris</label>
              <div className="relative">
                <Input type="tel" value={bettingUserId} onChange={(e) => setBettingUserId(e.target.value)} placeholder="Entrez l'ID utilisateur" className={`h-20 text-3xl font-black rounded-[2rem] border-2 px-8 transition-all duration-300 ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500" : "bg-white border-slate-100 shadow-xl shadow-slate-200/40 text-slate-900 focus:border-blue-500"}`} />
              </div>
            </div>

            <Button onClick={handleVerifyUserId} disabled={!bettingUserId || verifying} className={`w-full h-20 rounded-[2.5rem] text-xl font-black transition-all active:scale-[0.97] group overflow-hidden relative ${theme === "dark" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {verifying ? <Loader2 className="w-8 h-8 animate-spin" /> : <span>Rechercher le compte</span>}
            </Button>
          </div>
        </div>
      )}

      {/* 6. STEP 2: AMOUNT */}
      {step === 2 && verifiedUser && (
        <div className="flex flex-col h-[calc(100vh-100px)] px-4 z-10 relative animate-in slide-in-from-right-4">

          {/* Detailed Target Card */}
          <div className={`p-5 rounded-[3rem] border mb-6 flex items-center gap-4 ${theme === "dark" ? "bg-slate-800/60 border-slate-700/50 backdrop-blur-md" : "bg-white border-slate-50 shadow-2xl"}`}>
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check className="w-9 h-9 text-white" strokeWidth={4} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-black text-xl leading-tight truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}>ID {bettingUserId}</h3>
              <p className={`text-sm font-bold truncate ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{verifiedUser.Name}</p>
            </div>
            {platformLogo && <img src={platformLogo} alt="Logo" className="w-14 h-14 object-contain rounded-2xl" />}
          </div>

          {/* Large Input Area */}
          <div className="flex flex-col items-center justify-center flex-1">
            <span className={`text-xl font-black mb-2 ${theme === "dark" ? "text-slate-600" : "text-slate-300"}`}>CFA</span>
            <input type="tel" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} autoFocus className={`w-full bg-transparent border-none text-center font-black outline-none ${theme === "dark" ? "text-white" : "text-slate-900"}`} style={{ fontSize: amount.length > 8 ? '4rem' : '4.5rem' }} placeholder="0" />
            <span className={`text-xs mt-4 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
              Min: {parseFloat(platform.min_deposit_amount).toLocaleString()} CFA - Max: {parseFloat(platform.max_deposit_amount).toLocaleString()} CFA
            </span>
          </div>

          <Button onClick={handleCreateDeposit} disabled={parseFloat(amount) <= 0 || !amount || submitting} className={`w-full h-20 rounded-[2.5rem] text-2xl font-black transition-all active:scale-95 mb-10 ${theme === "dark" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <span>Déposer</span>}
          </Button>
        </div>
      )}
    </div>
  )
}
