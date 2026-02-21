"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Loader2, Check, XCircle } from "lucide-react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts"
import { bettingService } from "@/lib/betting-api"
import { BettingPlatform, VerifyUserIdResponse } from "@/lib/betting"

interface BettingWithdrawalScreenProps {
  platformUid: string
  onNavigateBack: () => void
  onSuccess?: () => void
}

export function BettingWithdrawalScreen({ platformUid, onNavigateBack, onSuccess }: BettingWithdrawalScreenProps) {
  const [step, setStep] = useState(1) // 1: User ID, 2: Code, 3: Confirm
  const [platform, setPlatform] = useState<BettingPlatform | null>(null)
  const [bettingUserId, setBettingUserId] = useState("")
  const [withdrawalCode, setWithdrawalCode] = useState("")
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
        setStep(2) // Code input step
      }
    } catch (error: any) {
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

  const handleVerifyCode = () => {
    if (!withdrawalCode.trim()) {
      toast({
        title: t("common.error"),
        description: t("betting.withdraw.errors.enterWithdrawalCode"),
        variant: "destructive",
      })
      return
    }
    setStep(3) // Confirmation step
  }

  const submitWithdrawal = async () => {
    if (!verifiedUser || !withdrawalCode.trim()) return

    setSubmitting(true)
    try {
      await bettingService.createWithdrawal({
        platform_uid: platformUid,
        betting_user_id: bettingUserId,
        withdrawal_code: withdrawalCode
      })

      // Show success toast
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!platform) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{t("betting.withdraw.notFoundTitle")}</h2>
          <Button onClick={onNavigateBack}>{t("common.back")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>

      {/* RED/BLUE Mesh Background for Withdrawal Context */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -right-[10%] w-[70%] h-[50%] rounded-[100%] opacity-20 blur-[120px] animate-pulse ${theme === "dark" ? "bg-red-500" : "bg-red-300"}`} style={{ animationDuration: '8s' }} />
        <div className={`absolute top-[20%] -left-[10%] w-[60%] h-[40%] rounded-[100%] opacity-10 blur-[100px] animate-pulse ${theme === "dark" ? "bg-blue-500" : "bg-blue-200"}`} style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* CUSTOM SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed top-8 left-0 right-0 z-[100] px-4 animate-in slide-in-from-top duration-500">
          <div className={`max-w-md mx-auto p-4 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] border flex items-center gap-4 ${theme === "dark" ? "bg-slate-800/90 border-slate-700/50 backdrop-blur-xl" : "bg-white/90 border-slate-100 backdrop-blur-xl"}`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h3 className={`font-black text-lg ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Retrait Réussi</h3>
              <p className={`text-sm font-medium leading-tight ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Votre demande de retrait a été traitée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-4 flex items-center justify-between z-10 relative mt-2 safe-area-inset-top">
        <Button variant="ghost" size="sm" onClick={step > 1 ? () => setStep(step - 1) : onNavigateBack} className={`h-11 w-11 p-0 rounded-2xl transition-all active:scale-90 ${theme === "dark" ? "text-slate-300 hover:bg-slate-800/80 bg-slate-800/40" : "text-slate-600 bg-white/80 hover:bg-white shadow-sm border border-slate-100"}`}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Retrait de paris - {platform.name}</p>
        <div className="w-11" />
      </div>

      {/* The Bottom Card Container Design */}
      <div className="flex-1 flex flex-col items-center justify-end z-10 relative h-[calc(100vh-120px)]">
        <div className={`w-full rounded-t-[2.5rem] shadow-2xl transition-all duration-700 animate-in slide-in-from-bottom-full flex flex-col ${theme === "dark" ? "bg-slate-900/60 border-t border-slate-800/50 backdrop-blur-2xl" : "bg-white border-t border-white/50 backdrop-blur-2xl shadow-[0_-15px_50px_rgba(0,0,0,0.1)]"}`}>

          <div className="flex justify-center pt-4 pb-2">
            <div className={`w-12 h-1 rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`} />
          </div>
          <div className="p-8 flex-1 flex flex-col min-h-[50vh]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col flex-1">
                <h2 className={`text-xl font-bold text-center mb-10 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Demande de retrait</h2>
                <div className="space-y-6 flex-1">
                  <Input type="tel" value={bettingUserId} onChange={(e) => setBettingUserId(e.target.value)} placeholder="Entrez l'ID Utilisateur" className={`h-14 rounded-2xl border-none text-lg ${theme === "dark" ? "bg-slate-800 text-white placeholder:text-slate-500" : "bg-slate-50 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
                <Button onClick={handleVerifyUserId} disabled={!bettingUserId || verifying} className="w-full h-14 rounded-2xl bg-[#4d69ec] hover:bg-[#3f57d1] text-white font-bold shadow-lg shadow-blue-500/20">
                  {verifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Suivant</span>}
                </Button>
              </div>
            )}

            {step === 2 && verifiedUser && (
              <div className="animate-in fade-in slide-in-from-right-4 flex flex-col flex-1">
                <h2 className={`text-xl font-bold text-center mb-10 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Renseigner le code</h2>
                <div className="space-y-6 flex-1">
                  <Input type="text" value={withdrawalCode} onChange={(e) => setWithdrawalCode(e.target.value)} placeholder="Code de retrait secret" className={`h-14 rounded-2xl border-none text-lg tracking-widest ${theme === "dark" ? "bg-slate-800 text-white placeholder:text-slate-500" : "bg-slate-50 text-slate-900 placeholder:text-slate-400"}`} />
                </div>
                <Button onClick={handleVerifyCode} disabled={!withdrawalCode} className="w-full h-14 rounded-2xl bg-[#4d69ec] hover:bg-[#3f57d1] text-white font-bold shadow-lg shadow-blue-500/20">Vérifier</Button>
              </div>
            )}

            {step === 3 && verifiedUser && (
              <div className="animate-in fade-in zoom-in-95 flex flex-col items-center flex-1">
                <h2 className={`text-lg font-bold mb-8 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Confirmation</h2>

                <div className="w-full space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Destinataire</span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{verifiedUser.Name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Identifiant WebUser</span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{bettingUserId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Plateforme</span>
                    <span className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{platform.name}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <span className="text-xs text-slate-500">Code secret à utiliser</span>
                    <span className={`font-mono text-xl tracking-widest font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{withdrawalCode}</span>
                  </div>
                </div>
                <Button onClick={submitWithdrawal} disabled={submitting} className="w-full h-14 rounded-2xl bg-[#4d69ec] hover:bg-[#3f57d1] text-white font-bold shadow-lg shadow-blue-500/20 mt-auto">
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Confirmer le retrait</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
