"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { formatAmount } from "@/lib/utils"
import { CheckCircle, Smartphone, CreditCard, Upload } from "lucide-react"

interface ConfirmationData {
  type: "deposit" | "withdraw" | "recharge"
  amount: string
  recipientPhone?: string
  selectedNetwork?: {
    uid: string
    nom: string
    code: string
  }
  proofDescription?: string
  proofImage?: File | null
}

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  data: ConfirmationData
  isProcessing?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  isProcessing = false
}: ConfirmationModalProps) {
  const { theme } = useTheme()
  const { t } = useTranslation()

  const getTypeIcon = () => {
    switch (data.type) {
      case "deposit":
        return <CreditCard className="w-6 h-6 text-blue-500" />
      case "withdraw":
        return <Smartphone className="w-6 h-6 text-green-500" />
      case "recharge":
        return <Upload className="w-6 h-6 text-purple-500" />
      default:
        return <CheckCircle className="w-6 h-6 text-blue-500" />
    }
  }

  const getTypeTitle = () => {
    switch (data.type) {
      case "deposit":
        return t("confirmation.depositTitle")
      case "withdraw":
        return t("confirmation.withdrawTitle")
      case "recharge":
        return t("confirmation.rechargeTitle")
      default:
        return t("confirmation.title")
    }
  }

  const getTypeDescription = () => {
    switch (data.type) {
      case "deposit":
        return t("confirmation.depositDescription")
      case "withdraw":
        return t("confirmation.withdrawDescription")
      case "recharge":
        return t("confirmation.rechargeDescription")
      default:
        return t("confirmation.description")
    }
  }

  const getConfirmButtonText = () => {
    if (isProcessing) {
      switch (data.type) {
        case "deposit":
          return t("confirmation.processingDeposit")
        case "withdraw":
          return t("confirmation.processingWithdraw")
        case "recharge":
          return t("confirmation.processingRecharge")
        default:
          return t("confirmation.processing")
      }
    }
    
    switch (data.type) {
      case "deposit":
        return t("confirmation.confirmDeposit")
      case "withdraw":
        return t("confirmation.confirmWithdraw")
      case "recharge":
        return t("confirmation.confirmRecharge")
      default:
        return t("confirmation.confirm")
    }
  }

  const getConfirmButtonColor = () => {
    switch (data.type) {
      case "deposit":
        return "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
      case "withdraw":
        return "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      case "recharge":
        return "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-md mx-auto ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}
        showCloseButton={!isProcessing}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}>
              {getTypeIcon()}
            </div>
          </div>
          <DialogTitle className={`text-xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {getTypeTitle()}
          </DialogTitle>
          <DialogDescription className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {getTypeDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className={`space-y-4 py-4 ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>
          {/* Amount */}
          <div className={`flex justify-between items-center p-3 rounded-lg ${
            theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
          }`}>
            <span className="text-sm font-medium">{t("confirmation.amount")}</span>
            <span className="text-lg font-bold text-blue-600">
              {formatAmount(data.amount)} FCFA
            </span>
          </div>

          {/* Recipient Phone (for deposit and withdraw) */}
          {(data.type === "deposit" || data.type === "withdraw") && data.recipientPhone && (
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <span className="text-sm font-medium">{t("confirmation.recipientPhone")}</span>
              <span className="text-sm font-semibold">{data.recipientPhone}</span>
            </div>
          )}

          {/* Selected Network (for deposit and withdraw) */}
          {(data.type === "deposit" || data.type === "withdraw") && data.selectedNetwork && (
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <span className="text-sm font-medium">{t("confirmation.network")}</span>
              <div className="text-right">
                <div className="text-sm font-semibold">{data.selectedNetwork.nom}</div>
                <div className="text-xs text-gray-500">{data.selectedNetwork.code}</div>
              </div>
            </div>
          )}

          {/* Proof Description (for recharge) */}
          {data.type === "recharge" && data.proofDescription && (
            <div className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <div className="text-sm font-medium mb-1">{t("confirmation.proofDescription")}</div>
              <div className="text-sm">{data.proofDescription}</div>
            </div>
          )}

          {/* Proof Image (for recharge) */}
          {data.type === "recharge" && data.proofImage && (
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <span className="text-sm font-medium">{t("confirmation.proofImage")}</span>
              <span className="text-sm font-semibold">{data.proofImage.name}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className={`w-full h-12 ${
              theme === "dark"
                ? "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                : "border-gray-200 text-gray-600 hover:bg-gray-100/50"
            }`}
          >
            {t("confirmation.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : `${getConfirmButtonColor()} hover:scale-[1.02] active:scale-[0.98]`
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {getConfirmButtonText()}
              </div>
            ) : (
              getConfirmButtonText()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
