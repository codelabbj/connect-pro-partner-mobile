"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Upload,
  AlertCircle
} from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useAuth } from "@/lib/contexts"
import { formatAmount } from "@/lib/utils"
import { ConfirmationModal } from "@/components/confirmation-modal"

interface RechargeScreenProps {
  onNavigateBack: () => void
}

export function RechargeScreen({ onNavigateBack }: RechargeScreenProps) {
  const [amount, setAmount] = useState("")
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofDescription, setProofDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { createRecharge, accountData } = useAuth()

  const handleRecharge = () => {
    if (!amount) {
      setError("Please enter an amount")
      return
    }
    
    setError("")
    setShowConfirmation(true)
  }

  const handleConfirmRecharge = async () => {
    setIsProcessing(true)
    
    try {
      await createRecharge({
        amount: amount,
        proof_image: proofImage,
        proof_description: proofDescription,
        transaction_date: null
      })
      
      setSuccess(true)
      setShowConfirmation(false)
      setTimeout(() => {
        onNavigateBack()
      }, 2000)
    } catch (error) {
      console.error('Recharge error:', error)
      
      // Parse backend validation errors
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message)
          if (typeof errorData === 'object' && errorData !== null) {
            // Handle field-specific errors
            const errorMessages: string[] = []
            Object.keys(errorData).forEach(field => {
              if (Array.isArray(errorData[field])) {
                errorMessages.push(...(errorData[field] as string[]))
              } else {
                errorMessages.push(String(errorData[field]))
              }
            })
            setError(errorMessages.join(', '))
          } else {
            setError(error.message)
          }
        } catch (parseError) {
          setError(error.message)
        }
      } else {
        setError("Failed to create recharge")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
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
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50" 
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {t("recharge.title")}
            </h1>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {t("recharge.subtitle")}
            </p>
          </div>
        </div>

        {/* Recharge Form */}
        <div className="space-y-6">
          {/* Balance Info */}
          <div className={`p-4 rounded-xl ${
            theme === "dark" ? "bg-gray-700/30" : "bg-gray-100/50"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {t("recharge.availableBalance")}
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {accountData?.formatted_balance || "Loading..."}
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("recharge.quickAmount")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {["5000", "10000", "50000"].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount)}
                  className={`h-10 ${
                    theme === "dark" 
                      ? "border-gray-600 hover:bg-gray-700/50 text-gray-300" 
                      : "border-gray-200 hover:bg-gray-100/50 text-gray-600"
                  }`}
                >
                  {formatAmount(quickAmount)} FCFA
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("recharge.rechargeAmount")}
            </Label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-bold ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                FCFA
              </span>
              <Input
                id="amount"
                type="number"
                placeholder={t("recharge.rechargeAmountPlaceholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-12 h-12 text-lg font-semibold ${
                  theme === "dark" 
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                    : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                }`}
              />
            </div>
          </div>

          {/* Proof Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("recharge.proofDescription")}
            </Label>
            <Input
              id="description"
              type="text"
              placeholder={t("recharge.proofDescriptionPlaceholder")}
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              className={`h-12 text-lg font-semibold ${
                theme === "dark" 
                  ? "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400" 
                  : "bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-500"
              }`}
            />
          </div>

          {/* Proof Image Upload */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              {t("recharge.proofImage")}
            </Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                className="hidden"
                id="proof-upload"
              />
              <label
                htmlFor="proof-upload"
                className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${
                  theme === "dark"
                    ? "border-gray-600 hover:border-gray-500 hover:bg-gray-700/30"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
                }`}
              >
                <Upload className="w-5 h-5" />
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  {proofImage ? proofImage.name : t("recharge.uploadProofImage")}
                </span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              theme === "dark" ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"
            }`}>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              theme === "dark" ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"
            }`}>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">{t("recharge.successMessage")}</span>
            </div>
          )}

          {/* Recharge Button */}
          <Button
            onClick={handleRecharge}
            disabled={!amount || isProcessing}
            className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
              !amount || isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t("recharge.creatingRecharge")}
              </div>
            ) : (
              t("recharge.createRecharge")
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmRecharge}
        data={{
          type: "recharge",
          amount: amount,
          proofDescription: proofDescription,
          proofImage: proofImage
        }}
        isProcessing={isProcessing}
      />
    </div>
  )
}