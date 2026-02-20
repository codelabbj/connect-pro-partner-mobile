"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Phone, Copy, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "@/lib/contexts"
import { useTranslation } from "@/lib/contexts"
import { useToast } from "@/hooks/use-toast"

interface UssdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ussdCode: string
  onContinue: () => void
}

export function UssdModal({
  open,
  onOpenChange,
  ussdCode,
  onContinue
}: UssdModalProps) {
  const { theme, resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [dialAttempted, setDialAttempted] = useState(false)

  // Automatically attempt to dial when modal opens
  useEffect(() => {
    if (open && ussdCode && !dialAttempted) {
      setDialAttempted(true)
      handleDialUssd()
    }
  }, [open, ussdCode, dialAttempted])

  // Reset dial attempt when modal closes
  useEffect(() => {
    if (!open) {
      setDialAttempted(false)
    }
  }, [open])

  const handleDialUssd = () => {
    try {
      // Try to open phone dialer with USSD code
      window.location.href = `tel:${ussdCode}`
      // Don't call onContinue here since we want to keep the modal open for manual copying
    } catch (error) {
      console.error('Failed to open phone dialer:', error)
      toast({
        title: t("ussd.dialerError"),
        description: t("ussd.dialerErrorDesc"),
        variant: "destructive",
      })
    }
  }

  const handleCopyUssd = async () => {
    try {
      await navigator.clipboard.writeText(ussdCode)
      setCopied(true)
      toast({
        title: t("common.copied"),
        description: t("ussd.copiedDesc", { code: ussdCode }),
      })
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy USSD code:', error)
      toast({
        title: t("common.copyFailed"),
        description: t("common.copyFailedDesc"),
        variant: "destructive",
      })
    }
  }

  const handleContinue = () => {
    onContinue()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-md mx-auto ${
        resolvedTheme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold text-center ${
            resolvedTheme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {t("ussd.title")}
          </DialogTitle>
          <DialogDescription className={`text-base text-center ${
            resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {dialAttempted ? t("ussd.descriptionAttempted") : t("ussd.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* USSD Code Display */}
          <div className={`p-6 rounded-lg border-2 border-dashed text-center ${
            resolvedTheme === "dark"
              ? "bg-gray-700/50 border-gray-600"
              : "bg-gray-50 border-gray-300"
          }`}>
            <p className={`text-base font-medium mb-3 ${
              resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              {t("ussd.codeLabel")}
            </p>
            <p className={`text-3xl font-bold font-mono tracking-wider ${
              resolvedTheme === "dark" ? "text-blue-400" : "text-blue-600"
            }`}>
              {ussdCode}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleDialUssd}
              className={`flex-1 h-14 text-base font-semibold transition-all duration-300 ${
                resolvedTheme === "dark"
                  ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                  : "bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20"
              } hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Phone className="w-5 h-5 mr-2" />
              {dialAttempted ? t("ussd.retryDialButton") : t("ussd.dialButton")}
            </Button>

            <Button
              onClick={handleCopyUssd}
              variant="outline"
              className={`h-14 px-5 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                copied ? "bg-green-50 border-green-200 text-green-700" : ""
              }`}
            >
              {copied ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className={`p-4 rounded-lg ${
            resolvedTheme === "dark" ? "bg-yellow-900/20 border border-yellow-800" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <p className={`text-base ${
              resolvedTheme === "dark" ? "text-yellow-300" : "text-yellow-700"
            }`}>
              {t("ussd.instruction")}
            </p>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
              resolvedTheme === "dark"
                ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20"
            } hover:scale-[1.02] active:scale-[0.98]`}
          >
            {t("ussd.continueButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
